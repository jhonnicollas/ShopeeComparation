import { describe, expect, it } from "vitest";
import type { ScoringInput } from "@shopee-research/shared";
import {
  calculateProductScore,
  calculateRatingScore,
  calculateReviewScore,
  calculateSoldScore,
  calculatePriceScore,
  calculateShopTrustScore,
  calculateResponseRateScore,
  calculateFeatureMatchScore,
  compareProductScores,
} from "./engine.js";

const baseInput: ScoringInput = {
  productId: "prd_1",
  rating: 4.5,
  reviewCount: 500,
  soldCount: 2000,
  priceMin: 100000,
  priceMax: 150000,
  shopStatus: "STAR",
  shopRating: 4.5,
  responseRate: 90,
  featureCount: 2,
  featureMatchCount: 1,
  risks: [],
};

describe("calculateRatingScore", () => {
  it("returns rating/5", () => {
    expect(calculateRatingScore(5)).toBe(1);
    expect(calculateRatingScore(4)).toBe(0.8);
    expect(calculateRatingScore(0)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(calculateRatingScore(null)).toBe(0);
  });

  it("clamps to [0,1]", () => {
    expect(calculateRatingScore(6)).toBe(1);
    expect(calculateRatingScore(-1)).toBe(0);
  });
});

describe("calculateReviewScore", () => {
  it("returns higher for more reviews", () => {
    const low = calculateReviewScore(10);
    const mid = calculateReviewScore(500);
    const high = calculateReviewScore(10000);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it("returns 0 for null", () => {
    expect(calculateReviewScore(null)).toBe(0);
  });
});

describe("calculateSoldScore", () => {
  it("returns higher for more sold", () => {
    expect(calculateSoldScore(10000)).toBeGreaterThan(calculateSoldScore(100));
  });

  it("returns 0 for null", () => {
    expect(calculateSoldScore(null)).toBe(0);
  });
});

describe("calculatePriceScore", () => {
  it("returns higher for lower price", () => {
    expect(calculatePriceScore(100000, 150000)).toBeGreaterThan(
      calculatePriceScore(800000, 900000)
    );
  });

  it("returns 0 for null", () => {
    expect(calculatePriceScore(null, null)).toBe(0);
  });
});

describe("calculateShopTrustScore", () => {
  it("returns 1 for MALL", () => {
    expect(calculateShopTrustScore("MALL")).toBe(1);
  });

  it("returns 0.85 for STARPLUS", () => {
    expect(calculateShopTrustScore("STARPLUS")).toBe(0.85);
  });

  it("returns 0.4 for unknown status", () => {
    expect(calculateShopTrustScore("UNKNOWN")).toBe(0.4);
  });

  it("returns 0.4 for null", () => {
    expect(calculateShopTrustScore(null)).toBe(0.4);
  });
});

describe("calculateResponseRateScore", () => {
  it("returns responseRate/100", () => {
    expect(calculateResponseRateScore(95)).toBe(0.95);
  });

  it("returns 0 for null", () => {
    expect(calculateResponseRateScore(null)).toBe(0);
  });
});

describe("calculateFeatureMatchScore", () => {
  it("returns 0.5 for 0 features", () => {
    expect(calculateFeatureMatchScore(0)).toBe(0.5);
  });

  it("returns 1 for 5 features", () => {
    expect(calculateFeatureMatchScore(5)).toBe(1);
  });
});

describe("calculateProductScore", () => {
  it("calculates score with all inputs", () => {
    const result = calculateProductScore(baseInput);
    expect(result.finalScore).toBeGreaterThan(0);
    expect(result.finalScore).toBeLessThanOrEqual(1);
    expect(result.ratingScore).toBeGreaterThan(0);
    expect(result.shopTrustScore).toBe(0.7);
  });

  it("is deterministic (same input = same output)", () => {
    const result1 = calculateProductScore(baseInput);
    const result2 = calculateProductScore(baseInput);
    expect(result1).toEqual(result2);
  });

  it("handles missing shop status", () => {
    const result = calculateProductScore({ ...baseInput, shopStatus: null });
    expect(result.shopTrustScore).toBe(0.4);
  });

  it("respects custom weights", () => {
    const baseResult = calculateProductScore(baseInput);
    const weightedResult = calculateProductScore(baseInput, {
      ratingScore: 0,
      reviewCountScore: 0,
      soldCountScore: 0,
      priceScore: 0,
      shopTrustScore: 0,
      responseRateScore: 0,
      featureMatchScore: 0,
      riskPenaltyMax: 0,
    });
    expect(weightedResult.finalScore).toBe(0);
    expect(baseResult.finalScore).toBeGreaterThan(0);
  });
});

describe("compareProductScores", () => {
  it("sorts by score descending", () => {
    const a = { finalScore: 0.5 } as unknown as ReturnType<typeof calculateProductScore>;
    const b = { finalScore: 0.8 } as unknown as ReturnType<typeof calculateProductScore>;
    expect(compareProductScores(a, b)).toBeGreaterThan(0);
    expect(compareProductScores(b, a)).toBeLessThan(0);
  });
});
