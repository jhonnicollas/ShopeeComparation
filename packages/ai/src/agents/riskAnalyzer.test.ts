import { describe, expect, it } from "vitest";
import type { ProductSnapshot } from "@shopee-research/shared";
import { analyzeRisk } from "./riskAnalyzer.js";

const mockProduct: ProductSnapshot = {
  shopeeItemId: "item-1",
  shopeeShopId: "shop-1",
  title: "Test",
  brand: null,
  category: null,
  originalUrl: null,
  canonicalUrl: null,
  imageUrl: null,
  galleryJson: null,
  videoUrl: null,
  priceMin: 100000,
  priceMax: null,
  priceBeforeDiscount: null,
  discountText: null,
  rating: 4.5,
  reviewCount: 100,
  soldCount: 500,
  favoriteCount: null,
  stock: 10,
  shippedFrom: "DKI Jakarta",
  description: null,
  specificationJson: null,
  variationJson: null,
  weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
  features: [],
  confidenceScore: 1,
};

describe("analyzeRisk", () => {
  it("export exists", () => {
    expect(analyzeRisk).toBeDefined();
  });

  it("returns traditional risks for unhealthy product", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({}),
        first: () => Promise.resolve(null),
        run: () => Promise.resolve(),
        all: () => Promise.resolve({ results: [] }),
      }),
    } as unknown as D1Database;
    const unhealthy: ProductSnapshot = { ...mockProduct, rating: 2.5 };
    const result = await analyzeRisk(db, {}, { product: unhealthy, shop: null });
    expect(result.traditionalRisks.length).toBeGreaterThan(0);
    expect(result.traditionalRisks.some((r) => r.type === "low_rating")).toBe(true);
  });
});
