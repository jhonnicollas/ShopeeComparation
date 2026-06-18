import { describe, expect, it } from "vitest";
import type { ProductSnapshot } from "@shopee-research/shared";
import { checkAiDataQuality } from "./dataQualityAgent.js";

const mockProduct: ProductSnapshot = {
  shopeeItemId: "item-1",
  shopeeShopId: "shop-1",
  title: "Test",
  brand: "Brand",
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
  description: "desc",
  specificationJson: { brand: "Brand" },
  variationJson: null,
  weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
  features: [],
  confidenceScore: 1,
};

describe("checkAiDataQuality", () => {
  it("export exists", () => {
    expect(checkAiDataQuality).toBeDefined();
  });

  it("returns traditional field quality", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({}),
        first: () => Promise.resolve(null),
        run: () => Promise.resolve(),
        all: () => Promise.resolve({ results: [] }),
      }),
    } as unknown as D1Database;
    const result = await checkAiDataQuality(db, {}, { product: mockProduct, shop: null });
    expect(result.traditionalFields.length).toBeGreaterThan(0);
  });
});
