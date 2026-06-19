import type {
  ProductSnapshot,
  SearchResultCandidate,
  ShopSnapshot,
} from "@shopee-research/shared";
import { upsertProduct, upsertShop } from "@shopee-research/db";
import {
  saveRawProductSnapshot,
  saveRawShopSnapshot,
} from "../extractors/snapshotStorage.js";
import type { FallbackShopeeExtractor } from "../extractors/fallbackExtractor.js";

export interface EnrichmentResult {
  products: ProductSnapshot[];
  shops: ShopSnapshot[];
  errors: Array<{ itemId: string; error: string }>;
  enrichedCount: number;
  failedCount: number;
}

export interface EnrichmentInput {
  db: D1Database;
  r2: R2Bucket;
  extractor: FallbackShopeeExtractor;
  candidates: SearchResultCandidate[];
  researchSessionId: string;
  jobId?: string;
  concurrency?: number;
  rawContent?: string;
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await worker(items[current]!);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length || 1)) },
    () => runWorker()
  );
  await Promise.all(workers);
  return results;
}

export async function runEnrichment(
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  const { db, r2, extractor, candidates, researchSessionId, rawContent } = input;
  const concurrency = input.concurrency ?? 5;
  void researchSessionId;
  const products: ProductSnapshot[] = [];
  const shops: ShopSnapshot[] = [];
  const errors: Array<{ itemId: string; error: string }> = [];

  if (candidates.length === 0) {
    return { products, shops, errors, enrichedCount: 0, failedCount: 0 };
  }

  await runWithConcurrency(
    candidates,
    async (candidate) => {
      const itemId = candidate.itemId ?? "";
      const shopId = candidate.shopId ?? "";
      const canonicalUrl = candidate.canonicalUrl ?? candidate.originalUrl ?? "";
      if (!itemId) {
        errors.push({ itemId: "(missing)", error: "candidate missing itemId" });
        return;
      }
      try {
        const productResult = await extractor.extractProduct({
          shopId,
          itemId,
          canonicalUrl: canonicalUrl || `https://shopee.co.id/product/${shopId}/${itemId}`,
        });
        const product: ProductSnapshot = {
          shopeeItemId: productResult.shopeeItemId,
          shopeeShopId: productResult.shopeeShopId,
          title: productResult.title,
          brand: productResult.brand,
          category: productResult.category,
          originalUrl: productResult.originalUrl,
          canonicalUrl: productResult.canonicalUrl,
          imageUrl: productResult.imageUrl,
          galleryJson: productResult.galleryJson,
          videoUrl: productResult.videoUrl,
          priceMin: productResult.priceMin,
          priceMax: productResult.priceMax,
          priceBeforeDiscount: productResult.priceBeforeDiscount,
          discountText: productResult.discountText,
          rating: productResult.rating,
          reviewCount: productResult.reviewCount,
          soldCount: productResult.soldCount,
          favoriteCount: productResult.favoriteCount,
          stock: productResult.stock,
          shippedFrom: productResult.shippedFrom,
          description: productResult.description,
          specificationJson: productResult.specificationJson,
          variationJson: productResult.variationJson,
          weight: productResult.weight,
          features: productResult.features,
          confidenceScore: productResult.confidenceScore,
        };
        let shop: ShopSnapshot | null = null;
        if (shopId) {
          const shopResult = await extractor.extractShop({ shopId });
          shop = {
            shopeeShopId: shopResult.shopeeShopId,
            name: shopResult.name,
            shopUrl: shopResult.shopUrl,
            statusLabels: shopResult.statusLabels,
            primaryStatus: shopResult.primaryStatus,
            rating: shopResult.rating,
            ratingCount: shopResult.ratingCount,
            responseRate: shopResult.responseRate,
            responseTime: shopResult.responseTime,
            followerCount: shopResult.followerCount,
            productCount: shopResult.productCount,
            joinedAgeText: shopResult.joinedAgeText,
            location: shopResult.location,
            confidenceScore: shopResult.confidenceScore,
          };
        }
        await upsertProduct(db, {
          id: `prd_${itemId}_${shopId}`,
          shopeeItemId: product.shopeeItemId ?? itemId,
          shopeeShopId: product.shopeeShopId ?? shopId,
          title: product.title,
          brand: product.brand,
          category: product.category,
          originalUrl: product.originalUrl,
          canonicalUrl: product.canonicalUrl,
          imageUrl: product.imageUrl,
          galleryJson: product.galleryJson,
          videoUrl: product.videoUrl,
          priceMin: product.priceMin,
          priceMax: product.priceMax,
          priceBeforeDiscount: product.priceBeforeDiscount,
          discountText: product.discountText,
          rating: product.rating,
          reviewCount: product.reviewCount,
          soldCount: product.soldCount,
          favoriteCount: product.favoriteCount,
          stock: product.stock,
          shippedFrom: product.shippedFrom,
          description: product.description,
          specificationJson: product.specificationJson,
          variationJson: product.variationJson,
          confidenceScore: product.confidenceScore,
        });
        if (rawContent) {
          try {
            await saveRawProductSnapshot({
              db,
              bucket: r2,
              product,
              rawContent,
              contentType: "text/html",
            });
          } catch {
            // snapshot save is best-effort
          }
        }
        products.push(product);
        if (shop) {
          try {
            await upsertShop(db, {
              id: `shp_${shopId}`,
              shopeeShopId: shop.shopeeShopId ?? shopId,
              name: shop.name,
              shopUrl: shop.shopUrl,
              statusJson: shop.statusLabels,
              primaryStatus: shop.primaryStatus,
              rating: shop.rating,
              ratingCount: shop.ratingCount,
              responseRate: shop.responseRate,
              responseTime: shop.responseTime,
              followerCount: shop.followerCount,
              productCount: shop.productCount,
              joinedAgeText: shop.joinedAgeText,
              location: shop.location,
              confidenceScore: shop.confidenceScore,
            });
            if (rawContent) {
              try {
                await saveRawShopSnapshot({
                  db,
                  bucket: r2,
                  shop,
                  rawContent,
                  contentType: "text/html",
                });
              } catch {
                // snapshot save is best-effort
              }
            }
            shops.push(shop);
          } catch {
            // shop save is best-effort
          }
        }
      } catch (error) {
        errors.push({
          itemId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    concurrency
  );

  return {
    products,
    shops,
    errors,
    enrichedCount: products.length,
    failedCount: errors.length,
  };
}
