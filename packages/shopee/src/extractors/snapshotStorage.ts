import {
  putSnapshot,
  createRawSnapshot,
  createFieldEvidence,
  type RawSnapshotRow,
  type FieldEvidenceRow,
} from "@shopee-research/db";
import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";

export interface SaveRawSnapshotInput {
  db: D1Database;
  bucket: R2Bucket;
  ownerId: string;
  ownerType: "product" | "shop" | "resolver";
  content: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface SaveRawSnapshotResult {
  r2Key: string;
  snapshot: RawSnapshotRow;
}

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `${prefix}_${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

export async function saveRawSnapshot(
  input: SaveRawSnapshotInput
): Promise<SaveRawSnapshotResult> {
  const result = await putSnapshot({
    bucket: input.bucket,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    contentType: input.contentType,
    data: input.content,
    metadata: input.metadata,
  });
  const snapshot = await createRawSnapshot(input.db, {
    id: generateId("raw"),
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    r2Key: result.r2Key,
    contentType: input.contentType,
    sizeBytes: result.sizeBytes,
  });
  return { r2Key: result.r2Key, snapshot };
}

export interface SaveProductSnapshotInput {
  db: D1Database;
  bucket: R2Bucket;
  product: ProductSnapshot;
  rawContent: string;
  contentType: string;
}

export interface SaveProductSnapshotResult {
  r2Key: string;
  evidenceRows: FieldEvidenceRow[];
}

export async function saveRawProductSnapshot(
  input: SaveProductSnapshotInput
): Promise<SaveProductSnapshotResult> {
  const productId = input.product.shopeeItemId;
  if (!productId) {
    throw new Error("Product must have shopeeItemId to save raw snapshot");
  }
  const { r2Key } = await saveRawSnapshot({
    db: input.db,
    bucket: input.bucket,
    ownerId: productId,
    ownerType: "product",
    content: input.rawContent,
    contentType: input.contentType,
  });
  const evidenceRows: FieldEvidenceRow[] = [];
  const fields: Array<{ name: string; value: unknown; status: "available" | "unavailable" | "partial"; confidence: number; source: string | null }> = [
    { name: "title", value: input.product.title, status: input.product.title ? "available" : "unavailable", confidence: input.product.title ? 1 : 0, source: "extraction" },
    { name: "priceMin", value: input.product.priceMin, status: input.product.priceMin !== null ? "available" : "unavailable", confidence: input.product.priceMin !== null ? 1 : 0, source: "extraction" },
    { name: "priceMax", value: input.product.priceMax, status: input.product.priceMax !== null ? "available" : "unavailable", confidence: input.product.priceMax !== null ? 1 : 0, source: "extraction" },
    { name: "rating", value: input.product.rating, status: input.product.rating !== null ? "available" : "unavailable", confidence: input.product.rating !== null ? 1 : 0, source: "extraction" },
    { name: "reviewCount", value: input.product.reviewCount, status: input.product.reviewCount !== null ? "available" : "unavailable", confidence: input.product.reviewCount !== null ? 1 : 0, source: "extraction" },
    { name: "soldCount", value: input.product.soldCount, status: input.product.soldCount !== null ? "available" : "unavailable", confidence: input.product.soldCount !== null ? 1 : 0, source: "extraction" },
    { name: "brand", value: input.product.brand, status: input.product.brand ? "available" : "unavailable", confidence: input.product.brand ? 1 : 0, source: "extraction" },
    { name: "category", value: input.product.category, status: input.product.category ? "available" : "unavailable", confidence: input.product.category ? 1 : 0, source: "extraction" },
  ];
  for (const field of fields) {
    const row = await createFieldEvidence(input.db, {
      id: generateId("evd"),
      ownerType: "product",
      ownerId: productId,
      fieldName: field.name,
      valueText: field.value !== null && field.value !== undefined ? String(field.value) : null,
      source: field.source,
      confidence: field.confidence,
      status: field.status,
      rawSnapshotR2Key: r2Key,
    });
    evidenceRows.push(row);
  }
  return { r2Key, evidenceRows };
}

export interface SaveShopSnapshotInput {
  db: D1Database;
  bucket: R2Bucket;
  shop: ShopSnapshot;
  rawContent: string;
  contentType: string;
}

export interface SaveShopSnapshotResult {
  r2Key: string;
  evidenceRows: FieldEvidenceRow[];
}

export async function saveRawShopSnapshot(
  input: SaveShopSnapshotInput
): Promise<SaveShopSnapshotResult> {
  const shopId = input.shop.shopeeShopId;
  if (!shopId) {
    throw new Error("Shop must have shopeeShopId to save raw snapshot");
  }
  const { r2Key } = await saveRawSnapshot({
    db: input.db,
    bucket: input.bucket,
    ownerId: shopId,
    ownerType: "shop",
    content: input.rawContent,
    contentType: input.contentType,
  });
  const evidenceRows: FieldEvidenceRow[] = [];
  const fields: Array<{ name: string; value: unknown; status: "available" | "unavailable" | "partial"; confidence: number; source: string | null }> = [
    { name: "name", value: input.shop.name, status: input.shop.name ? "available" : "unavailable", confidence: input.shop.name ? 1 : 0, source: "extraction" },
    { name: "rating", value: input.shop.rating, status: input.shop.rating !== null ? "available" : "unavailable", confidence: input.shop.rating !== null ? 1 : 0, source: "extraction" },
    { name: "responseRate", value: input.shop.responseRate, status: input.shop.responseRate !== null ? "available" : "unavailable", confidence: input.shop.responseRate !== null ? 1 : 0, source: "extraction" },
    { name: "followerCount", value: input.shop.followerCount, status: input.shop.followerCount !== null ? "available" : "unavailable", confidence: input.shop.followerCount !== null ? 1 : 0, source: "extraction" },
    { name: "primaryStatus", value: input.shop.primaryStatus, status: input.shop.primaryStatus !== "UNKNOWN" ? "available" : "unavailable", confidence: input.shop.primaryStatus !== "UNKNOWN" ? 1 : 0, source: "extraction" },
  ];
  for (const field of fields) {
    const row = await createFieldEvidence(input.db, {
      id: generateId("evd"),
      ownerType: "shop",
      ownerId: shopId,
      fieldName: field.name,
      valueText: field.value !== null && field.value !== undefined ? String(field.value) : null,
      source: field.source,
      confidence: field.confidence,
      status: field.status,
      rawSnapshotR2Key: r2Key,
    });
    evidenceRows.push(row);
  }
  return { r2Key, evidenceRows };
}
