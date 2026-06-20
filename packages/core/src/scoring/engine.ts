import type { ScoringWeights, ScoringInput, ScoringOutput } from "@shopee-research/shared";

export const defaultScoringWeights: ScoringWeights = {
  ratingScore: 0.25,
  reviewCountScore: 0.1,
  soldCountScore: 0.15,
  priceScore: 0.15,
  shopTrustScore: 0.15,
  responseRateScore: 0.1,
  featureMatchScore: 0.1,
  riskPenaltyMax: 0.2,
};

const MAX_REVIEW_COUNT = 10000;
const MAX_SOLD_COUNT = 100000;
const MAX_PRICE_IDR = 1000000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateRatingScore(rating: number | null): number {
  if (rating === null) return 0;
  return clamp(rating / 5, 0, 1);
}

export function calculateReviewScore(reviewCount: number | null): number {
  if (reviewCount === null) return 0;
  return clamp(Math.log10(reviewCount + 1) / Math.log10(MAX_REVIEW_COUNT + 1), 0, 1);
}

export function calculateSoldScore(soldCount: number | null): number {
  if (soldCount === null) return 0;
  return clamp(Math.log10(soldCount + 1) / Math.log10(MAX_SOLD_COUNT + 1), 0, 1);
}

export function calculatePriceScore(priceMin: number | null, priceMax: number | null): number {
  if (priceMin === null) return 0;
  const price = priceMax ?? priceMin;
  return clamp(1 - price / MAX_PRICE_IDR, 0, 1);
}

export function calculateShopTrustScore(shopStatus: string | null): number {
  if (shopStatus === "MALL" || shopStatus === "OFFICIAL") return 1;
  if (shopStatus === "STARPLUS") return 0.85;
  if (shopStatus === "STAR") return 0.7;
  if (shopStatus === "PREFERRED") return 0.55;
  return 0.4;
}

export function calculateResponseRateScore(responseRate: number | null): number {
  if (responseRate === null) return 0;
  return clamp(responseRate / 100, 0, 1);
}

export function calculateFeatureMatchScore(featureCount: number): number {
  if (featureCount === 0) return 0.5;
  return clamp(featureCount / 5, 0, 1);
}

export function calculateProductScore(input: ScoringInput, weights?: ScoringWeights): ScoringOutput {
  const w = weights ?? defaultScoringWeights;
  const ratingScore = calculateRatingScore(input.rating);
  const reviewCountScore = calculateReviewScore(input.reviewCount);
  const soldCountScore = calculateSoldScore(input.soldCount);
  const priceScore = calculatePriceScore(input.priceMin, input.priceMax);
  const shopTrustScore = calculateShopTrustScore(input.shopStatus);
  const responseRateScore = calculateResponseRateScore(input.responseRate);
  const featureMatchScore = calculateFeatureMatchScore(input.featureCount);

  const finalScore =
    ratingScore * w.ratingScore +
    reviewCountScore * w.reviewCountScore +
    soldCountScore * w.soldCountScore +
    priceScore * w.priceScore +
    shopTrustScore * w.shopTrustScore +
    responseRateScore * w.responseRateScore +
    featureMatchScore * w.featureMatchScore;

  return {
    finalScore: Math.round(finalScore * 1000) / 1000,
    ratingScore: Math.round(ratingScore * 1000) / 1000,
    reviewCountScore: Math.round(reviewCountScore * 1000) / 1000,
    soldCountScore: Math.round(soldCountScore * 1000) / 1000,
    priceScore: Math.round(priceScore * 1000) / 1000,
    shopTrustScore: Math.round(shopTrustScore * 1000) / 1000,
    responseRateScore: Math.round(responseRateScore * 1000) / 1000,
    featureMatchScore: Math.round(featureMatchScore * 1000) / 1000,
    riskPenalty: 0,
  };
}

export function compareProductScores(a: ScoringOutput, b: ScoringOutput): number {
  return b.finalScore - a.finalScore;
}
