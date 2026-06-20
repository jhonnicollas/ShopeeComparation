import { describe, expect, it } from "vitest";
import type { ProductSnapshot } from "@shopee-research/shared";
import { buildPrompt, generateRecommendation } from "./recommendationWriter.js";

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

describe("buildPrompt", () => {
  it("includes products and user query", () => {
    const prompt = buildPrompt({
      products: [mockProduct],
      shops: new Map(),
      userQuery: "best laptop",
    });
    expect(prompt).toContain("best laptop");
    expect(prompt).toContain("item-1");
    expect(prompt).toContain("Test");
  });
});

describe("generateRecommendation", () => {
  it("export exists", () => {
    expect(generateRecommendation).toBeDefined();
  });
});
