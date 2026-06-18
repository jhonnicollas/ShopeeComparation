import { describe, expect, it } from "vitest";
import {
  FallbackShopeeExtractor,
  emptyProduct,
  emptyShop,
  mergeProduct,
  mergeShop,
  type ShopeeExtractorLike,
} from "./fallbackExtractor.js";

function createAdapter(
  name: string,
  overrides: Partial<ShopeeExtractorLike> = {}
): ShopeeExtractorLike {
  return {
    name,
    resolveUrl: async () => ({
      originalUrl: "x",
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "manual",
      status: "failed",
      errorMessage: `${name} not implemented`,
    }),
    searchProducts: async () => [],
    extractProduct: async () => emptyProduct("0", "0", ""),
    extractShop: async () => emptyShop("0"),
    ...overrides,
  };
}

describe("FallbackShopeeExtractor", () => {
  describe("resolveUrl", () => {
    it("returns first successful adapter result", async () => {
      const adapter1 = createAdapter("a1", {
        resolveUrl: async () => ({
          originalUrl: "x",
          finalUrl: "y",
          canonicalUrl: "y",
          shopId: "1",
          itemId: "2",
          resolveMethod: "direct",
          status: "resolved",
        }),
      });
      const adapter2 = createAdapter("a2");
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.resolveUrl({ url: "x" });
      expect(result.status).toBe("resolved");
      expect(result.itemId).toBe("2");
    });

    it("falls back to next adapter on failure", async () => {
      const adapter1 = createAdapter("a1", {
        resolveUrl: async () => ({
          originalUrl: "x",
          finalUrl: null,
          canonicalUrl: null,
          shopId: null,
          itemId: null,
          resolveMethod: "manual",
          status: "failed",
          errorMessage: "a1 fail",
        }),
      });
      const adapter2 = createAdapter("a2", {
        resolveUrl: async () => ({
          originalUrl: "x",
          finalUrl: "y",
          canonicalUrl: "y",
          shopId: "1",
          itemId: "2",
          resolveMethod: "direct",
          status: "resolved",
        }),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.resolveUrl({ url: "x" });
      expect(result.status).toBe("resolved");
    });

    it("returns failed when all adapters fail", async () => {
      const adapter1 = createAdapter("a1");
      const adapter2 = createAdapter("a2");
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.resolveUrl({ url: "x" });
      expect(result.status).toBe("failed");
    });
  });

  describe("searchProducts", () => {
    it("merges results from all adapters", async () => {
      const adapter1 = createAdapter("a1", {
        searchProducts: async () => [
          {
            title: "P1",
            originalUrl: null,
            canonicalUrl: "u1",
            itemId: "1",
            shopId: "1",
            priceMin: 100,
            priceMax: 100,
            rating: 4.5,
            reviewCount: 10,
            soldCount: 50,
            shippedFrom: "DKI Jakarta",
            shopName: null,
            source: "a1",
            confidence: 0.8,
          },
        ],
      });
      const adapter2 = createAdapter("a2", {
        searchProducts: async () => [
          {
            title: "P2",
            originalUrl: null,
            canonicalUrl: "u2",
            itemId: "2",
            shopId: "2",
            priceMin: 200,
            priceMax: 200,
            rating: 4.0,
            reviewCount: 5,
            soldCount: 20,
            shippedFrom: "DKI Jakarta",
            shopName: null,
            source: "a2",
            confidence: 0.7,
          },
        ],
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const results = await extractor.searchProducts({
        keyword: "test",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(results).toHaveLength(2);
    });

    it("deduplicates results", async () => {
      const adapter1 = createAdapter("a1", {
        searchProducts: async () => [
          {
            title: "P1",
            originalUrl: null,
            canonicalUrl: "u1",
            itemId: "1",
            shopId: "1",
            priceMin: 100,
            priceMax: 100,
            rating: 4.5,
            reviewCount: 10,
            soldCount: 50,
            shippedFrom: "DKI Jakarta",
            shopName: null,
            source: "a1",
            confidence: 0.8,
          },
        ],
      });
      const adapter2 = createAdapter("a2", {
        searchProducts: async () => [
          {
            title: "P1-dup",
            originalUrl: null,
            canonicalUrl: "u1",
            itemId: "1",
            shopId: "1",
            priceMin: 100,
            priceMax: 100,
            rating: 4.5,
            reviewCount: 10,
            soldCount: 50,
            shippedFrom: "DKI Jakarta",
            shopName: null,
            source: "a2",
            confidence: 0.7,
          },
        ],
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const results = await extractor.searchProducts({
        keyword: "test",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(results).toHaveLength(1);
    });
  });

  describe("extractProduct", () => {
    it("merges data from multiple adapters", async () => {
      const adapter1 = createAdapter("a1", {
        extractProduct: async () => ({
          ...emptyProduct("1", "2", "https://shopee.co.id/product/1/2"),
          title: "Test Product",
          priceMin: 100,
          priceMax: 100,
          confidenceScore: 0.7,
        }),
      });
      const adapter2 = createAdapter("a2", {
        extractProduct: async () => ({
          ...emptyProduct("1", "2", "https://shopee.co.id/product/1/2"),
          rating: 4.5,
          soldCount: 100,
          confidenceScore: 0.5,
        }),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.extractProduct({ shopId: "1", itemId: "2" });
      expect(result.title).toBe("Test Product");
      expect(result.priceMin).toBe(100);
      expect(result.rating).toBe(4.5);
      expect(result.soldCount).toBe(100);
      expect(result.confidenceScore).toBe(0.7);
    });

    it("returns partial success when some adapters fail", async () => {
      const adapter1 = createAdapter("a1", {
        extractProduct: async () => {
          throw new Error("a1 fail");
        },
      });
      const adapter2 = createAdapter("a2", {
        extractProduct: async () => ({
          ...emptyProduct("1", "2", "url"),
          title: "Product",
          confidenceScore: 0.6,
        }),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.extractProduct({ shopId: "1", itemId: "2" });
      expect(result.title).toBe("Product");
      expect(result.diagnostics.partialSuccess).toBe(true);
      expect(result.diagnostics.attempts).toHaveLength(2);
    });

    it("returns empty when all adapters fail", async () => {
      const adapter1 = createAdapter("a1", {
        extractProduct: async () => emptyProduct("1", "2", "url"),
      });
      const adapter2 = createAdapter("a2", {
        extractProduct: async () => emptyProduct("1", "2", "url"),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.extractProduct({ shopId: "1", itemId: "2" });
      expect(result.title).toBeNull();
      expect(result.diagnostics.partialSuccess).toBe(false);
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe("extractShop", () => {
    it("merges data from multiple adapters", async () => {
      const adapter1 = createAdapter("a1", {
        extractShop: async () => ({
          ...emptyShop("1"),
          name: "Test Shop",
          primaryStatus: "STAR",
          confidenceScore: 0.7,
        }),
      });
      const adapter2 = createAdapter("a2", {
        extractShop: async () => ({
          ...emptyShop("1"),
          rating: 4.5,
          followerCount: 1000,
          confidenceScore: 0.5,
        }),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1, adapter2] });
      const result = await extractor.extractShop({ shopId: "1" });
      expect(result.name).toBe("Test Shop");
      expect(result.primaryStatus).toBe("STAR");
      expect(result.rating).toBe(4.5);
      expect(result.followerCount).toBe(1000);
    });

    it("returns empty when all fail", async () => {
      const adapter1 = createAdapter("a1", {
        extractShop: async () => emptyShop("1"),
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter1] });
      const result = await extractor.extractShop({ shopId: "1" });
      expect(result.name).toBeNull();
      expect(result.diagnostics.partialSuccess).toBe(false);
    });
  });

  describe("error safety", () => {
    it("sanitizes secrets in error messages", async () => {
      const adapter = createAdapter("a1", {
        extractProduct: async () => {
          throw new Error("api_key=secret12345 token=abc");
        },
      });
      const extractor = new FallbackShopeeExtractor({ adapters: [adapter] });
      const result = await extractor.extractProduct({ shopId: "1", itemId: "2" });
      const errorMsg = result.diagnostics.attempts[0]?.errorMessage;
      expect(errorMsg).toBeDefined();
      expect(errorMsg).not.toContain("secret12345");
    });
  });
});

describe("mergeProduct", () => {
  it("fills null fields with source values", () => {
    const target = emptyProduct("1", "2", "url");
    const source = {
      ...emptyProduct("1", "2", "url"),
      title: "Test",
      priceMin: 100,
      confidenceScore: 0.5,
    };
    const merged = mergeProduct(target, source);
    expect(merged.title).toBe("Test");
    expect(merged.priceMin).toBe(100);
  });

  it("keeps target value if both have data", () => {
    const target = { ...emptyProduct("1", "2", "url"), title: "Target" };
    const source = { ...emptyProduct("1", "2", "url"), title: "Source" };
    const merged = mergeProduct(target, source);
    expect(merged.title).toBe("Target");
  });
});

describe("mergeShop", () => {
  it("promotes shop status from UNKNOWN to MALL/STAR/STARPLUS", () => {
    const target = emptyShop("1");
    const source = { ...emptyShop("1"), primaryStatus: "MALL" as const };
    const merged = mergeShop(target, source);
    expect(merged.primaryStatus).toBe("MALL");
  });

  it("keeps existing MALL/STAR status", () => {
    const target = { ...emptyShop("1"), primaryStatus: "STARPLUS" as const };
    const source = { ...emptyShop("1"), primaryStatus: "REGULAR" as const };
    const merged = mergeShop(target, source);
    expect(merged.primaryStatus).toBe("STARPLUS");
  });
});
