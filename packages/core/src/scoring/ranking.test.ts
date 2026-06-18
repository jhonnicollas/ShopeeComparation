import { describe, expect, it } from "vitest";
import type { ProductSnapshot, ScoringOutput } from "@shopee-research/shared";
import { rankProducts, compareRankedProducts } from "./ranking.js";

const baseProduct = (itemId: string, rating: number | null, reviewCount: number | null): ProductSnapshot => ({
  shopeeItemId: itemId,
  shopeeShopId: "shop-1",
  title: "T",
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
  rating,
  reviewCount,
  soldCount: null,
  favoriteCount: null,
  stock: null,
  shippedFrom: null,
  description: null,
  specificationJson: null,
  variationJson: null,
  weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
  features: [],
  confidenceScore: 1,
});

const baseScoring = (score: number): ScoringOutput => ({
  finalScore: score,
  ratingScore: 0.8,
  reviewCountScore: 0.5,
  soldCountScore: 0.5,
  priceScore: 0.5,
  shopTrustScore: 0.5,
  responseRateScore: 0.5,
  featureMatchScore: 0.5,
  riskPenalty: 0,
});

describe("rankProducts", () => {
  it("returns empty array for empty input", () => {
    expect(rankProducts([])).toEqual([]);
  });

  it("assigns ranks starting from 1", () => {
    const result = rankProducts([
      { product: baseProduct("item-1", 4.5, 100), scoring: baseScoring(0.7) },
      { product: baseProduct("item-2", 4.0, 50), scoring: baseScoring(0.5) },
    ]);
    expect(result[0]?.rank).toBe(1);
    expect(result[1]?.rank).toBe(2);
  });

  it("sorts by score descending", () => {
    const result = rankProducts([
      { product: baseProduct("item-1", 4.0, 50), scoring: baseScoring(0.5) },
      { product: baseProduct("item-2", 4.5, 100), scoring: baseScoring(0.8) },
      { product: baseProduct("item-3", 4.2, 75), scoring: baseScoring(0.6) },
    ]);
    expect(result[0]?.scoring.finalScore).toBe(0.8);
    expect(result[1]?.scoring.finalScore).toBe(0.6);
    expect(result[2]?.scoring.finalScore).toBe(0.5);
  });
});

describe("compareRankedProducts", () => {
  it("uses rating as tiebreaker", () => {
    const a = { product: baseProduct("item-1", 4.0, 100), scoring: baseScoring(0.7) };
    const b = { product: baseProduct("item-2", 4.5, 100), scoring: baseScoring(0.7) };
    expect(compareRankedProducts(a, b)).toBeGreaterThan(0);
  });

  it("uses review count as second tiebreaker", () => {
    const a = { product: baseProduct("item-1", 4.5, 50), scoring: baseScoring(0.7) };
    const b = { product: baseProduct("item-2", 4.5, 100), scoring: baseScoring(0.7) };
    expect(compareRankedProducts(a, b)).toBeGreaterThan(0);
  });

  it("returns 0 for completely identical products", () => {
    const a = { product: baseProduct("item-1", 4.5, 100), scoring: baseScoring(0.7) };
    const b = { product: baseProduct("item-1", 4.5, 100), scoring: baseScoring(0.7) };
    expect(compareRankedProducts(a, b)).toBe(0);
  });

  it("handles null rating", () => {
    const a = { product: baseProduct("item-1", null, 100), scoring: baseScoring(0.7) };
    const b = { product: baseProduct("item-2", 4.5, 100), scoring: baseScoring(0.7) };
    expect(compareRankedProducts(a, b)).toBeGreaterThan(0);
  });
});
