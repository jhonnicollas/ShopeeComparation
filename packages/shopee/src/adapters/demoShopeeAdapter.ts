import type { SearchInput, SearchResultCandidate, ProductSnapshot, ShopSnapshot, ExtractProductInput, ExtractShopInput } from "@shopee-research/shared";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * Demo data adapter for the search + compare workflow.
 *
 * When the real Shopee extraction returns 0 results (because Shopee blocks
 * Cloudflare Workers as a bot) AND `app.demoMode=true` is set in
 * sh_appConfigs, this adapter returns curated demo data from
 * sh_demoProducts / sh_demoShops tables. All demo products are clearly
 * labeled with `source: "demo"` and `confidence: 0.3`. The UI MUST display
 * a "DEMO MODE" banner whenever this adapter is used.
 *
 * This is NOT a fallback for production extraction. It is an opt-in admin
 * feature for demoing the workflow when real Shopee data is unavailable.
 *
 * PRD §8.6 compliance: demo fields are clearly attributed (source="demo",
 * confidence 0.3). Real extraction never uses this path.
 */

export interface DemoShopeeAdapterOptions {
  db: D1Database;
  fetchImpl?: typeof fetch;
}

interface DemoProductRow {
  id: string;
  shopeeItemId: string;
  shopeeShopId: string;
  title: string;
  brand: string | null;
  category: string | null;
  originalUrl: string;
  canonicalUrl: string;
  imageUrl: string | null;
  priceMin: number;
  priceMax: number | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  shippedFrom: string;
  description: string | null;
  weightGrams: number | null;
}

interface DemoShopRow {
  id: string;
  shopeeShopId: string;
  name: string;
  shopUrl: string;
  statusLabels: string;
  primaryStatus: string;
  rating: number;
  ratingCount: number;
  responseRate: number;
  responseTime: string;
  followerCount: number;
  productCount: number;
  joinedAgeText: string;
  location: string;
}

function safeJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class DemoShopeeAdapter {
  name = "demo";
  private db: D1Database;

  constructor(options: DemoShopeeAdapterOptions) {
    this.db = options.db;
  }

  async isEnabled(): Promise<boolean> {
    const result = await this.db
      .prepare("SELECT value FROM sh_appConfigs WHERE key = ? AND isEnabled = 1 LIMIT 1")
      .bind("app.demoMode")
      .first<{ value: string | null }>();
    return result?.value === "true" || result?.value === "1";
  }

  async searchProducts(input: SearchInput): Promise<SearchResultCandidate[]> {
    const enabled = await this.isEnabled();
    if (!enabled) return [];
    const keyword = input.keyword.toLowerCase().trim();
    const limit = Math.min(input.limit, 10);
    const products = await this.db
      .prepare(
        "SELECT * FROM sh_demoProducts WHERE LOWER(demoKeyword) = ? ORDER BY demoPosition ASC LIMIT ?"
      )
      .bind(keyword, limit)
      .all<DemoProductRow>();
    return (products.results ?? []).map((p) => ({
      title: p.title,
      originalUrl: p.originalUrl,
      canonicalUrl: p.canonicalUrl,
      itemId: p.shopeeItemId,
      shopId: p.shopeeShopId,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      rating: p.rating,
      reviewCount: p.reviewCount,
      soldCount: p.soldCount,
      shippedFrom: p.shippedFrom,
      shopName: null,
      source: "demo",
      confidence: 0.3,
    }));
  }

  async extractProduct(input: ExtractProductInput): Promise<ProductSnapshot> {
    const product = await this.db
      .prepare(
        "SELECT * FROM sh_demoProducts WHERE shopeeItemId = ? AND shopeeShopId = ? LIMIT 1"
      )
      .bind(input.itemId, input.shopId)
      .first<DemoProductRow>();
    if (!product) {
      return this.emptyProduct(input.shopId, input.itemId);
    }
    return {
      shopeeItemId: product.shopeeItemId,
      shopeeShopId: product.shopeeShopId,
      title: product.title,
      brand: product.brand,
      category: product.category,
      originalUrl: product.originalUrl,
      canonicalUrl: product.canonicalUrl,
      imageUrl: product.imageUrl,
      galleryJson: null,
      videoUrl: null,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      priceBeforeDiscount: null,
      discountText: null,
      rating: product.rating,
      reviewCount: product.reviewCount,
      soldCount: product.soldCount,
      favoriteCount: null,
      stock: null,
      shippedFrom: product.shippedFrom,
      description: product.description,
      specificationJson: null,
      variationJson: null,
      weight: product.weightGrams != null
        ? {
            value: product.weightGrams,
            unit: "gram",
            rawText: `Berat: ${product.weightGrams}g`,
            source: "demo",
            confidence: 0.3,
          }
        : { value: null, unit: null, rawText: null, source: "demo", confidence: 0 },
      features: [
        { name: "brand", value: product.brand, source: "demo", confidence: 0.3 },
        { name: "category", value: product.category, source: "demo", confidence: 0.3 },
        { name: "demoSource", value: "Curated demo data", source: "demo", confidence: 0.3 },
      ],
      confidenceScore: 0.3,
    };
  }

  async extractShop(input: ExtractShopInput): Promise<ShopSnapshot> {
    const shop = await this.db
      .prepare("SELECT * FROM sh_demoShops WHERE shopeeShopId = ? LIMIT 1")
      .bind(input.shopId)
      .first<DemoShopRow>();
    if (!shop) {
      return this.emptyShop(input.shopId);
    }
    return {
      shopeeShopId: shop.shopeeShopId,
      name: shop.name,
      shopUrl: shop.shopUrl,
      statusLabels: safeJsonArray(shop.statusLabels),
      primaryStatus: shop.primaryStatus as ShopSnapshot["primaryStatus"],
      rating: shop.rating,
      ratingCount: shop.ratingCount,
      responseRate: shop.responseRate,
      responseTime: shop.responseTime,
      followerCount: shop.followerCount,
      productCount: shop.productCount,
      joinedAgeText: shop.joinedAgeText,
      location: shop.location,
      confidenceScore: 0.3,
    };
  }

  async resolveUrl(input: { url: string }): Promise<{
    originalUrl: string;
    finalUrl: string | null;
    canonicalUrl: string | null;
    shopId: string | null;
    itemId: string | null;
    resolveMethod: string;
    status: "resolved" | "failed";
    errorMessage?: string;
  }> {
    const match = input.url.match(/demo-shop-(\d+)\/demo-([a-z]+)-(\d+)/);
    if (match) {
      return {
        originalUrl: input.url,
        finalUrl: input.url,
        canonicalUrl: input.url,
        shopId: `demo-shop-${match[1]}`,
        itemId: `demo-${match[2]}-${match[3]}`,
        resolveMethod: "demo",
        status: "resolved",
      };
    }
    return {
      originalUrl: input.url,
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "demo",
      status: "failed",
      errorMessage: "URL does not match demo data pattern",
    };
  }

  private emptyProduct(shopId: string, itemId: string): ProductSnapshot {
    return {
      shopeeItemId: itemId,
      shopeeShopId: shopId,
      title: null,
      brand: null,
      category: null,
      originalUrl: null,
      canonicalUrl: null,
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin: null,
      priceMax: null,
      priceBeforeDiscount: null,
      discountText: null,
      rating: null,
      reviewCount: null,
      soldCount: null,
      favoriteCount: null,
      stock: null,
      shippedFrom: null,
      description: null,
      specificationJson: null,
      variationJson: null,
      weight: { value: null, unit: null, rawText: null, source: "demo", confidence: 0 },
      features: [],
      confidenceScore: 0,
    };
  }

  private emptyShop(shopId: string): ShopSnapshot {
    return {
      shopeeShopId: shopId,
      name: null,
      shopUrl: null,
      statusLabels: [],
      primaryStatus: "UNKNOWN",
      rating: null,
      ratingCount: null,
      responseRate: null,
      responseTime: null,
      followerCount: null,
      productCount: null,
      joinedAgeText: null,
      location: null,
      confidenceScore: 0,
    };
  }
}
