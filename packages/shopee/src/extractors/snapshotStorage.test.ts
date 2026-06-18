import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveRawProductSnapshot,
  saveRawShopSnapshot,
  saveRawSnapshot,
} from "./snapshotStorage.js";
import { emptyProduct, emptyShop } from "./fallbackExtractor.js";

class MockD1Database {
  public prepared: Array<{ query: string; args: unknown[] }> = [];

  prepare(query: string) {
    const stmt = {
      bind: vi.fn((...args: unknown[]) => {
        this.prepared.push({ query, args });
        return stmt;
      }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    };
    return stmt;
  }
}

class MockR2Bucket {
  public objects: Map<string, { data: string; contentType: string }> = new Map();
  public keys: string[] = [];

  async put(key: string, data: string | ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) {
    const content = typeof data === "string" ? data : new TextDecoder().decode(data);
    this.objects.set(key, { data: content, contentType: options?.httpMetadata?.contentType ?? "text/plain" });
    this.keys.push(key);
    return { key, uploaded: new Date() };
  }
}

describe("snapshotStorage", () => {
  let db: MockD1Database;
  let bucket: MockR2Bucket;

  beforeEach(() => {
    db = new MockD1Database();
    bucket = new MockR2Bucket();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveRawSnapshot", () => {
    it("saves raw content to R2 and records in sh_rawSnapshots", async () => {
      const result = await saveRawSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        ownerId: "item-1",
        ownerType: "product",
        content: "<html>raw content</html>",
        contentType: "text/html",
      });
      expect(result.r2Key).toMatch(/^snapshots\/product\//);
      expect(result.snapshot.id).toMatch(/^raw_/);
      expect(result.snapshot.ownerId).toBe("item-1");
      expect(result.snapshot.ownerType).toBe("product");
      expect(bucket.keys).toHaveLength(1);
    });

    it("includes metadata in R2 object", async () => {
      await saveRawSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        ownerId: "item-1",
        ownerType: "product",
        content: "content",
        contentType: "text/html",
        metadata: { source: "test", itemId: "1" },
      });
      const obj = Array.from(bucket.objects.values())[0];
      expect(obj).toBeDefined();
    });
  });

  describe("saveRawProductSnapshot", () => {
    it("saves product snapshot and creates field evidence rows", async () => {
      const product = {
        ...emptyProduct("1", "123", "url"),
        title: "Test Product",
        priceMin: 100000,
        priceMax: 150000,
        rating: 4.5,
        reviewCount: 50,
        soldCount: 200,
        brand: "BrandX",
        category: "CatA",
      };
      const result = await saveRawProductSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        product,
        rawContent: "<html>raw</html>",
        contentType: "text/html",
      });
      expect(result.r2Key).toMatch(/^snapshots\/product\//);
      expect(result.evidenceRows.length).toBe(8);
      const titles = result.evidenceRows.map((r) => r.fieldName);
      expect(titles).toContain("title");
      expect(titles).toContain("priceMin");
      expect(titles).toContain("rating");
    });

    it("marks missing fields as unavailable with confidence 0", async () => {
      const product = emptyProduct("1", "123", "url");
      const result = await saveRawProductSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        product,
        rawContent: "<html>raw</html>",
        contentType: "text/html",
      });
      const titleEvidence = result.evidenceRows.find((r) => r.fieldName === "title");
      expect(titleEvidence?.status).toBe("unavailable");
      expect(titleEvidence?.confidence).toBe(0);
      expect(titleEvidence?.valueText).toBeNull();
    });

    it("throws when product has no itemId", async () => {
      const product = { ...emptyProduct("1", "", "url") };
      await expect(
        saveRawProductSnapshot({
          db: db as unknown as D1Database,
          bucket: bucket as unknown as R2Bucket,
          product,
          rawContent: "<html>raw</html>",
          contentType: "text/html",
        })
      ).rejects.toThrow("Product must have shopeeItemId");
    });
  });

  describe("saveRawShopSnapshot", () => {
    it("saves shop snapshot and creates field evidence rows", async () => {
      const shop = {
        ...emptyShop("123"),
        name: "Test Shop",
        rating: 4.8,
        responseRate: 95,
        followerCount: 10000,
        primaryStatus: "STAR" as const,
      };
      const result = await saveRawShopSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        shop,
        rawContent: "<html>raw</html>",
        contentType: "text/html",
      });
      expect(result.r2Key).toMatch(/^snapshots\/shop\//);
      expect(result.evidenceRows.length).toBe(5);
      const statusEvidence = result.evidenceRows.find((r) => r.fieldName === "primaryStatus");
      expect(statusEvidence?.valueText).toBe("STAR");
      expect(statusEvidence?.status).toBe("available");
    });

    it("marks unknown status as unavailable", async () => {
      const shop = emptyShop("123");
      const result = await saveRawShopSnapshot({
        db: db as unknown as D1Database,
        bucket: bucket as unknown as R2Bucket,
        shop,
        rawContent: "<html>raw</html>",
        contentType: "text/html",
      });
      const statusEvidence = result.evidenceRows.find((r) => r.fieldName === "primaryStatus");
      expect(statusEvidence?.status).toBe("unavailable");
    });

    it("throws when shop has no shopId", async () => {
      const shop = { ...emptyShop(""), name: "Test" };
      await expect(
        saveRawShopSnapshot({
          db: db as unknown as D1Database,
          bucket: bucket as unknown as R2Bucket,
          shop,
          rawContent: "<html>raw</html>",
          contentType: "text/html",
        })
      ).rejects.toThrow("Shop must have shopeeShopId");
    });
  });
});
