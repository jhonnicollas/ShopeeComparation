import type { ShopSnapshot, ShopRow } from "@shopee-research/shared";

export interface UpsertShopInput {
  id: string;
  shopeeShopId: string | null;
  name: string | null;
  shopUrl: string | null;
  statusJson: string[] | null;
  primaryStatus: string | null;
  rating: number | null;
  ratingCount: number | null;
  responseRate: number | null;
  responseTime: string | null;
  followerCount: number | null;
  productCount: number | null;
  joinedAgeText: string | null;
  location: string | null;
  confidenceScore: number;
}

export async function findShopById(db: D1Database, id: string): Promise<ShopRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_shops WHERE id = ?")
    .bind(id)
    .first<ShopRow>();
  return result ?? null;
}

export async function findShopByShopeeId(
  db: D1Database,
  shopeeShopId: string
): Promise<ShopRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_shops WHERE shopeeShopId = ?")
    .bind(shopeeShopId)
    .first<ShopRow>();
  return result ?? null;
}

export async function upsertShop(db: D1Database, input: UpsertShopInput): Promise<ShopRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_shops (
        id, shopeeShopId, name, shopUrl, statusJson, primaryStatus,
        rating, ratingCount, responseRate, responseTime,
        followerCount, productCount, joinedAgeText, location,
        confidenceScore, lastCheckedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(shopeeShopId) DO UPDATE SET
        name = excluded.name,
        shopUrl = excluded.shopUrl,
        statusJson = excluded.statusJson,
        primaryStatus = excluded.primaryStatus,
        rating = excluded.rating,
        ratingCount = excluded.ratingCount,
        responseRate = excluded.responseRate,
        responseTime = excluded.responseTime,
        followerCount = excluded.followerCount,
        productCount = excluded.productCount,
        joinedAgeText = excluded.joinedAgeText,
        location = excluded.location,
        confidenceScore = excluded.confidenceScore,
        lastCheckedAt = excluded.lastCheckedAt,
        updatedAt = excluded.updatedAt`
    )
    .bind(
      input.id,
      input.shopeeShopId ?? "",
      input.name,
      input.shopUrl,
      input.statusJson ? JSON.stringify(input.statusJson) : null,
      input.primaryStatus,
      input.rating,
      input.ratingCount,
      input.responseRate,
      input.responseTime,
      input.followerCount,
      input.productCount,
      input.joinedAgeText,
      input.location,
      input.confidenceScore,
      now,
      now,
      now
    )
    .run();
  const existing = input.shopeeShopId ? await findShopByShopeeId(db, input.shopeeShopId) : null;
  if (existing) {
    return existing;
  }
  const result = await findShopById(db, input.id);
  if (!result) {
    throw new Error("Failed to upsert shop");
  }
  return result;
}

export function snapshotToUpsertShop(
  id: string,
  snapshot: ShopSnapshot
): UpsertShopInput {
  return {
    id,
    shopeeShopId: snapshot.shopeeShopId,
    name: snapshot.name,
    shopUrl: snapshot.shopUrl,
    statusJson: snapshot.statusLabels,
    primaryStatus: snapshot.primaryStatus,
    rating: snapshot.rating,
    ratingCount: snapshot.ratingCount,
    responseRate: snapshot.responseRate,
    responseTime: snapshot.responseTime,
    followerCount: snapshot.followerCount,
    productCount: snapshot.productCount,
    joinedAgeText: snapshot.joinedAgeText,
    location: snapshot.location,
    confidenceScore: snapshot.confidenceScore,
  };
}
