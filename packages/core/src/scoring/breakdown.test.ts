import { describe, expect, it } from "vitest";
import { generateScoreBreakdown } from "./breakdown.js";

const defaultWeights = {
  ratingScore: 0.25,
  reviewCountScore: 0.1,
  soldCountScore: 0.15,
  priceScore: 0.15,
  shopTrustScore: 0.15,
  responseRateScore: 0.1,
  featureMatchScore: 0.1,
  riskPenaltyMax: 0.2,
};

describe("generateScoreBreakdown", () => {
  it("returns 7 breakdown items", () => {
    const items = generateScoreBreakdown(
      {
        finalScore: 0.7,
        ratingScore: 0.9,
        reviewCountScore: 0.8,
        soldCountScore: 0.7,
        priceScore: 0.6,
        shopTrustScore: 0.8,
        responseRateScore: 0.9,
        featureMatchScore: 0.5,
        riskPenalty: 0,
      },
      defaultWeights
    );
    expect(items).toHaveLength(7);
  });

  it("includes all expected components", () => {
    const items = generateScoreBreakdown(
      {
        finalScore: 0.7,
        ratingScore: 0.9,
        reviewCountScore: 0.8,
        soldCountScore: 0.7,
        priceScore: 0.6,
        shopTrustScore: 0.8,
        responseRateScore: 0.9,
        featureMatchScore: 0.5,
        riskPenalty: 0,
      },
      defaultWeights
    );
    const components = items.map((i) => i.component);
    expect(components).toContain("rating");
    expect(components).toContain("reviewCount");
    expect(components).toContain("soldCount");
    expect(components).toContain("price");
    expect(components).toContain("shopTrust");
    expect(components).toContain("responseRate");
    expect(components).toContain("featureMatch");
  });

  it("calculates contribution as score * weight", () => {
    const items = generateScoreBreakdown(
      {
        finalScore: 0.7,
        ratingScore: 0.8,
        reviewCountScore: 0,
        soldCountScore: 0,
        priceScore: 0,
        shopTrustScore: 0,
        responseRateScore: 0,
        featureMatchScore: 0,
        riskPenalty: 0,
      },
      defaultWeights
    );
    const rating = items.find((i) => i.component === "rating");
    expect(rating?.contribution).toBe(0.8 * 0.25);
  });

  it("assigns level based on score", () => {
    const items = generateScoreBreakdown(
      {
        finalScore: 0.5,
        ratingScore: 0.9,
        reviewCountScore: 0.5,
        soldCountScore: 0.2,
        priceScore: 0,
        shopTrustScore: 0.7,
        responseRateScore: 0,
        featureMatchScore: 0,
        riskPenalty: 0,
      },
      defaultWeights
    );
    const rating = items.find((i) => i.component === "rating");
    expect(rating?.level).toBe("high");
    const review = items.find((i) => i.component === "reviewCount");
    expect(review?.level).toBe("medium");
    const sold = items.find((i) => i.component === "soldCount");
    expect(sold?.level).toBe("low");
  });

  it("provides meaningful reason for each component", () => {
    const items = generateScoreBreakdown(
      {
        finalScore: 0.5,
        ratingScore: 0,
        reviewCountScore: 0,
        soldCountScore: 0,
        priceScore: 0,
        shopTrustScore: 0,
        responseRateScore: 0,
        featureMatchScore: 0,
        riskPenalty: 0,
      },
      defaultWeights
    );
    for (const item of items) {
      expect(item.reason.length).toBeGreaterThan(0);
    }
  });
});
