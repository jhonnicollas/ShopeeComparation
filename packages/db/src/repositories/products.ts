import type { ProductSnapshot, ProductRow } from "@shopee-research/shared";

export interface UpsertProductInput {
  id: string;
  shopeeItemId: string;
  shopeeShopId: string;
  title: string | null;
  brand: string | null;
  category: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  galleryJson: string[] | null;
  videoUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceBeforeDiscount: number | null;
  discountText: string | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  favoriteCount: number | null;
  stock: number | null;
  shippedFrom: string | null;
  description: string | null;
  specificationJson: Record<string, unknown> | null;
  variationJson: Record<string, unknown> | null;
  confidenceScore: number;
}

export async function findProductById(db: D1Database, id: string): Promise<ProductRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_products WHERE id = ?")
    .bind(id)
    .first<ProductRow>();
  return result ?? null;
}

export async function findProductByShopeeItemId(
  db: D1Database,
  shopeeItemId: string
): Promise<ProductRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_products WHERE shopeeItemId = ?")
    .bind(shopeeItemId)
    .first<ProductRow>();
  return result ?? null;
}

export async function upsertProduct(
  db: D1Database,
  input: UpsertProductInput
): Promise<ProductRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_products (
        id, shopeeItemId, shopeeShopId, title, brand, category,
        originalUrl, canonicalUrl, imageUrl, galleryJson, videoUrl,
        priceMin, priceMax, priceBeforeDiscount, discountText,
        rating, reviewCount, soldCount, favoriteCount, stock,
        shippedFrom, description, specificationJson, variationJson,
        confidenceScore, lastCheckedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        shopeeItemId = excluded.shopeeItemId,
        shopeeShopId = excluded.shopeeShopId,
        title = excluded.title,
        brand = excluded.brand,
        category = excluded.category,
        originalUrl = excluded.originalUrl,
        canonicalUrl = excluded.canonicalUrl,
        imageUrl = excluded.imageUrl,
        galleryJson = excluded.galleryJson,
        videoUrl = excluded.videoUrl,
        priceMin = excluded.priceMin,
        priceMax = excluded.priceMax,
        priceBeforeDiscount = excluded.priceBeforeDiscount,
        discountText = excluded.discountText,
        rating = excluded.rating,
        reviewCount = excluded.reviewCount,
        soldCount = excluded.soldCount,
        favoriteCount = excluded.favoriteCount,
        stock = excluded.stock,
        shippedFrom = excluded.shippedFrom,
        description = excluded.description,
        specificationJson = excluded.specificationJson,
        variationJson = excluded.variationJson,
        confidenceScore = excluded.confidenceScore,
        lastCheckedAt = excluded.lastCheckedAt,
        updatedAt = excluded.updatedAt`
    )
    .bind(
      input.id,
      input.shopeeItemId,
      input.shopeeShopId,
      input.title,
      input.brand,
      input.category,
      input.originalUrl,
      input.canonicalUrl,
      input.imageUrl,
      input.galleryJson ? JSON.stringify(input.galleryJson) : null,
      input.videoUrl,
      input.priceMin,
      input.priceMax,
      input.priceBeforeDiscount,
      input.discountText,
      input.rating,
      input.reviewCount,
      input.soldCount,
      input.favoriteCount,
      input.stock,
      input.shippedFrom,
      input.description,
      input.specificationJson ? JSON.stringify(input.specificationJson) : null,
      input.variationJson ? JSON.stringify(input.variationJson) : null,
      input.confidenceScore,
      now,
      now,
      now
    )
    .run();
  const result = await findProductById(db, input.id);
  if (!result) {
    throw new Error("Failed to upsert product");
  }
  return result;
}

export function snapshotToUpsertProduct(
  id: string,
  shopeeItemId: string,
  shopeeShopId: string,
  snapshot: ProductSnapshot
): UpsertProductInput {
  return {
    id,
    shopeeItemId,
    shopeeShopId,
    title: snapshot.title,
    brand: snapshot.brand,
    category: snapshot.category,
    originalUrl: snapshot.originalUrl,
    canonicalUrl: snapshot.canonicalUrl,
    imageUrl: snapshot.imageUrl,
    galleryJson: snapshot.galleryJson,
    videoUrl: snapshot.videoUrl,
    priceMin: snapshot.priceMin,
    priceMax: snapshot.priceMax,
    priceBeforeDiscount: snapshot.priceBeforeDiscount,
    discountText: snapshot.discountText,
    rating: snapshot.rating,
    reviewCount: snapshot.reviewCount,
    soldCount: snapshot.soldCount,
    favoriteCount: snapshot.favoriteCount,
    stock: snapshot.stock,
    shippedFrom: snapshot.shippedFrom,
    description: snapshot.description,
    specificationJson: snapshot.specificationJson,
    variationJson: snapshot.variationJson,
    confidenceScore: snapshot.confidenceScore,
  };
}
