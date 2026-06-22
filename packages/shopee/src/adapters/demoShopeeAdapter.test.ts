import { describe, it, expect, vi } from "vitest";
import { DemoShopeeAdapter } from "./demoShopeeAdapter.js";

function makeFakeDb(rowsByQuery: Record<string, { results: unknown[] }> = {}) {
  const db = {
    prepare: vi.fn((sql: string) => {
      const matchKey = Object.keys(rowsByQuery).find((k) => sql.includes(k));
      const data = matchKey ? rowsByQuery[matchKey] : { results: [] };
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(data.results[0] ?? null),
        all: vi.fn().mockResolvedValue(data),
      };
    }),
  };
  return db as unknown as D1Database;
}

describe("DemoShopeeAdapter — PRD §8.6 no-fabrication compliance", () => {
  describe("isEnabled", () => {
    it("returns true when app.demoMode=true", async () => {
      const db = makeFakeDb({
        sh_appConfigs: { results: [{ value: "true" }] },
      });
      const adapter = new DemoShopeeAdapter({ db });
      expect(await adapter.isEnabled()).toBe(true);
    });

    it("returns true when app.demoMode=1", async () => {
      const db = makeFakeDb({
        sh_appConfigs: { results: [{ value: "1" }] },
      });
      const adapter = new DemoShopeeAdapter({ db });
      expect(await adapter.isEnabled()).toBe(true);
    });

    it("returns false when app.demoMode=false", async () => {
      const db = makeFakeDb({
        sh_appConfigs: { results: [{ value: "false" }] },
      });
      const adapter = new DemoShopeeAdapter({ db });
      expect(await adapter.isEnabled()).toBe(false);
    });

    it("returns false when config row missing", async () => {
      const db = makeFakeDb();
      const adapter = new DemoShopeeAdapter({ db });
      expect(await adapter.isEnabled()).toBe(false);
    });
  });

  describe("searchProducts", () => {
    it("returns empty when demo mode disabled", async () => {
      const db = makeFakeDb({ sh_appConfigs: { results: [] } });
      const adapter = new DemoShopeeAdapter({ db });
      const results = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 5,
      });
      expect(results).toEqual([]);
    });

    it("returns demo products with source='demo' and confidence=0.3", async () => {
      const db = makeFakeDb({
        sh_appConfigs: { results: [{ value: "true" }] },
        sh_demoProducts: {
          results: [
            {
              id: "demo_prd_001",
              shopeeItemId: "demo-item-001",
              shopeeShopId: "demo-shop-001",
              title: "Demo Multimeter",
              brand: "DemoBrand",
              category: "Alat Ukur",
              originalUrl: "https://shopee.co.id/demo-shop-001/demo-item-001",
              canonicalUrl: "https://shopee.co.id/demo-shop-001/demo-item-001",
              imageUrl: null,
              priceMin: 85000,
              priceMax: 125000,
              rating: 4.8,
              reviewCount: 2340,
              soldCount: 12500,
              shippedFrom: "DKI Jakarta",
              description: "Demo product description",
              weightGrams: 350,
            },
          ],
        },
      });
      const adapter = new DemoShopeeAdapter({ db });
      const results = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 5,
      });
      expect(results.length).toBe(1);
      expect(results[0]?.source).toBe("demo");
      expect(results[0]?.confidence).toBe(0.3);
      expect(results[0]?.title).toBe("Demo Multimeter");
      expect(results[0]?.priceMin).toBe(85000);
    });
  });

  describe("extractProduct", () => {
    it("returns demo product with all fields and source=demo, confidence=0.3", async () => {
      const db = makeFakeDb({
        sh_demoProducts: {
          results: [
            {
              id: "demo_prd_001",
              shopeeItemId: "demo-item-001",
              shopeeShopId: "demo-shop-001",
              title: "Demo Product",
              brand: "DemoBrand",
              category: "Demo Cat",
              originalUrl: "https://shopee.co.id/demo-shop-001/demo-item-001",
              canonicalUrl: "https://shopee.co.id/demo-shop-001/demo-item-001",
              imageUrl: null,
              priceMin: 100000,
              priceMax: 150000,
              rating: 4.5,
              reviewCount: 500,
              soldCount: 2000,
              shippedFrom: "DKI Jakarta",
              description: "Demo description",
              weightGrams: 250,
            },
          ],
        },
      });
      const adapter = new DemoShopeeAdapter({ db });
      const product = await adapter.extractProduct({
        shopId: "demo-shop-001",
        itemId: "demo-item-001",
      });
      expect(product.title).toBe("Demo Product");
      expect(product.confidenceScore).toBe(0.3);
      expect(product.weight?.value).toBe(250);
      expect(product.weight?.unit).toBe("gram");
      expect(product.features.length).toBeGreaterThan(0);
    });

    it("returns empty snapshot when product not in demo data", async () => {
      const db = makeFakeDb();
      const adapter = new DemoShopeeAdapter({ db });
      const product = await adapter.extractProduct({
        shopId: "unknown",
        itemId: "unknown",
      });
      expect(product.title).toBeNull();
      expect(product.confidenceScore).toBe(0);
    });
  });

  describe("extractShop", () => {
    it("returns demo shop with confidence 0.3", async () => {
      const db = makeFakeDb({
        sh_demoShops: {
          results: [
            {
              id: "demo_shp_001",
              shopeeShopId: "demo-shop-001",
              name: "Demo Shop",
              shopUrl: "https://shopee.co.id/demo-shop-001",
              statusLabels: '["MALL"]',
              primaryStatus: "MALL",
              rating: 4.9,
              ratingCount: 5000,
              responseRate: 99,
              responseTime: "1 jam",
              followerCount: 100000,
              productCount: 250,
              joinedAgeText: "5 tahun",
              location: "DKI Jakarta",
            },
          ],
        },
      });
      const adapter = new DemoShopeeAdapter({ db });
      const shop = await adapter.extractShop({ shopId: "demo-shop-001" });
      expect(shop.name).toBe("Demo Shop");
      expect(shop.primaryStatus).toBe("MALL");
      expect(shop.statusLabels).toEqual(["MALL"]);
      expect(shop.confidenceScore).toBe(0.3);
    });

    it("returns UNKNOWN shop when not found in demo data", async () => {
      const db = makeFakeDb();
      const adapter = new DemoShopeeAdapter({ db });
      const shop = await adapter.extractShop({ shopId: "unknown" });
      expect(shop.name).toBeNull();
      expect(shop.primaryStatus).toBe("UNKNOWN");
    });

    it("parses malformed statusLabels JSON gracefully", async () => {
      const db = makeFakeDb({
        sh_demoShops: {
          results: [
            {
              id: "demo_shp_001",
              shopeeShopId: "demo-shop-001",
              name: "Shop",
              shopUrl: "https://shopee.co.id/demo-shop-001",
              statusLabels: "not json",
              primaryStatus: "STAR",
              rating: 4.5,
              ratingCount: 100,
              responseRate: 90,
              responseTime: "1 hari",
              followerCount: 1000,
              productCount: 50,
              joinedAgeText: "1 tahun",
              location: "DKI Jakarta",
            },
          ],
        },
      });
      const adapter = new DemoShopeeAdapter({ db });
      const shop = await adapter.extractShop({ shopId: "demo-shop-001" });
      expect(shop.statusLabels).toEqual([]);
    });
  });

  describe("resolveUrl", () => {
    it("parses demo URL pattern", async () => {
      const adapter = new DemoShopeeAdapter({
        db: makeFakeDb({ sh_appConfigs: { results: [{ value: "true" }] } }),
      });
      const result = await adapter.resolveUrl({
        url: "https://shopee.co.id/demo-shop-001/demo-item-001",
      });
      expect(result.status).toBe("resolved");
      expect(result.shopId).toBe("demo-shop-001");
      expect(result.itemId).toBe("demo-item-001");
    });

    it("returns failed for non-demo URL", async () => {
      const adapter = new DemoShopeeAdapter({
        db: makeFakeDb({ sh_appConfigs: { results: [{ value: "true" }] } }),
      });
      const result = await adapter.resolveUrl({
        url: "https://shopee.co.id/some-real-product/123/456",
      });
      expect(result.status).toBe("failed");
    });
  });
});
