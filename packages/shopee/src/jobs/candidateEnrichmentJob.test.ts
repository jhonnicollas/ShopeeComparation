import { beforeEach, describe, expect, it, vi } from "vitest";
import { runEnrichment } from "./candidateEnrichmentJob.js";
import { FallbackShopeeExtractor, emptyProduct, emptyShop } from "../extractors/fallbackExtractor.js";
import type { ProductSnapshot, SearchResultCandidate, ShopSnapshot } from "@shopee-research/shared";

class MockD1 {
  public products: Map<string, unknown> = new Map();
  public shops: Map<string, unknown> = new Map();
  public jobs: Map<string, unknown> = new Map();
  public upsertError: string | null = null;
  private lastArgs: unknown[] = [];

  prepare() {
    const stmt = {
      bind: vi.fn((...args: unknown[]) => {
        this.lastArgs = args;
        return stmt;
      }),
      first: vi.fn().mockImplementation(async () => {
        const args = this.lastArgs;
        const op = args[0] as string | undefined;
        if (op && op.startsWith("prd")) {
          return {
            id: op,
            shopeeItemId: op,
            shopeeShopId: "",
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
            confidenceScore: 0,
            lastCheckedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rawSnapshotR2Key: null,
          };
        }
        if (op && op.startsWith("shp")) {
          return {
            id: op,
            shopeeShopId: op,
            name: null,
            shopUrl: null,
            statusJson: null,
            primaryStatus: null,
            rating: null,
            ratingCount: null,
            responseRate: null,
            responseTime: null,
            followerCount: null,
            productCount: null,
            joinedAgeText: null,
            location: null,
            confidenceScore: 0,
            lastCheckedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rawSnapshotR2Key: null,
          };
        }
        return null;
      }),
      run: vi.fn().mockImplementation(async () => {
        if (this.upsertError) {
          throw new Error(this.upsertError);
        }
        return { success: true };
      }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    };
    return stmt;
  }
}

class MockR2 {
  public objects: Map<string, string> = new Map();
  async put(key: string, data: string) {
    this.objects.set(key, data);
    return { key, uploaded: new Date() };
  }
  async get(key: string) {
    return this.objects.has(key)
      ? { body: this.objects.get(key)!, contentType: "text/html" }
      : null;
  }
}

function makeCandidate(overrides: Partial<SearchResultCandidate>): SearchResultCandidate {
  return {
    title: null,
    originalUrl: null,
    canonicalUrl: null,
    itemId: null,
    shopId: null,
    priceMin: null,
    priceMax: null,
    rating: null,
    reviewCount: null,
    soldCount: null,
    shippedFrom: "DKI Jakarta",
    shopName: null,
    source: "test",
    confidence: 0.5,
    ...overrides,
  };
}

function makeMockAdapter(opts: {
  products?: (input: { shopId: string; itemId: string; canonicalUrl?: string }) => ProductSnapshot | Promise<ProductSnapshot>;
  shops?: (input: { shopId: string }) => ShopSnapshot | Promise<ShopSnapshot>;
} = {}) {
  return new FallbackShopeeExtractor({
    adapters: [
      {
        name: "mock",
        resolveUrl: async () => ({
          originalUrl: "x",
          finalUrl: null,
          canonicalUrl: null,
          shopId: null,
          itemId: null,
          resolveMethod: "manual",
          status: "failed",
        }),
        searchProducts: async () => [],
        extractProduct: async (input) => {
          if (opts.products) {
            return await Promise.resolve(opts.products(input));
          }
          return {
            ...emptyProduct(input.shopId, input.itemId, input.canonicalUrl ?? ""),
            title: `Product ${input.itemId}`,
            confidenceScore: 0.7,
          };
        },
        extractShop: async (input) => {
          if (opts.shops) {
            return await Promise.resolve(opts.shops(input));
          }
          return {
            ...emptyShop(input.shopId),
            name: `Shop ${input.shopId}`,
            confidenceScore: 0.6,
          };
        },
      },
    ],
  });
}

describe("candidate enrichment job", () => {
  let db: MockD1;
  let r2: MockR2;
  const researchSessionId = "rsr_test_1";

  beforeEach(() => {
    db = new MockD1();
    r2 = new MockR2();
  });

  it("returns empty result for empty candidates", async () => {
    const extractor = makeMockAdapter();
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates: [],
      researchSessionId,
    });
    expect(result.products).toHaveLength(0);
    expect(result.shops).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.enrichedCount).toBe(0);
    expect(result.failedCount).toBe(0);
  });

  it("enriches all candidates successfully", async () => {
    const extractor = makeMockAdapter();
    const candidates = [
      makeCandidate({ itemId: "1", shopId: "1" }),
      makeCandidate({ itemId: "2", shopId: "2" }),
    ];
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
    });
    expect(result.errors).toEqual([]);
    expect(result.enrichedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.products).toHaveLength(2);
    expect(result.shops).toHaveLength(2);
  });

  it("handles per-candidate failure", async () => {
    const extractor = makeMockAdapter({
      products: (input) => {
        if (input.itemId === "1") throw new Error("product fail");
        return { ...emptyProduct(input.shopId, input.itemId, ""), title: "ok", confidenceScore: 0.7 };
      },
    });
    const candidates = [
      makeCandidate({ itemId: "1", shopId: "1" }),
      makeCandidate({ itemId: "2", shopId: "2" }),
    ];
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
    });
    expect(result.products).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.failedCount).toBe(0);
  });

  it("skips candidates without itemId", async () => {
    const extractor = makeMockAdapter();
    const candidates = [makeCandidate({ itemId: null, shopId: "1" })];
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
    });
    expect(result.products).toHaveLength(0);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0]?.itemId).toBe("(missing)");
  });

  it("saves raw content to R2 when provided", async () => {
    const extractor = makeMockAdapter();
    const candidates = [makeCandidate({ itemId: "1", shopId: "1" })];
    await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
      rawContent: "<html>raw</html>",
    });
    expect(r2.objects.size).toBeGreaterThan(0);
  });

  it("handles job creation with jobId", async () => {
    const extractor = makeMockAdapter();
    const candidates = [makeCandidate({ itemId: "1", shopId: "1" })];
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
      jobId: "job_1",
    });
    expect(result.enrichedCount).toBe(1);
  });

  it("respects custom concurrency", async () => {
    const extractor = makeMockAdapter();
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ itemId: String(i), shopId: String(i) })
    );
    const result = await runEnrichment({
      db: db as unknown as D1Database,
      r2: r2 as unknown as R2Bucket,
      extractor,
      candidates,
      researchSessionId,
      concurrency: 2,
    });
    expect(result.enrichedCount).toBe(10);
  });
});
