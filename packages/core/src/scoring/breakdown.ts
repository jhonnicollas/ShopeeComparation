import type { ScoringOutput } from "@shopee-research/shared";

export interface ScoreBreakdownItem {
  component: string;
  score: number;
  weight: number;
  contribution: number;
  reason: string;
  level: "low" | "medium" | "high";
}

export function generateScoreBreakdown(
  output: ScoringOutput,
  weights: { ratingScore: number; reviewCountScore: number; soldCountScore: number; priceScore: number; shopTrustScore: number; responseRateScore: number; featureMatchScore: number; riskPenaltyMax: number }
): ScoreBreakdownItem[] {
  const items: ScoreBreakdownItem[] = [
    {
      component: "rating",
      score: output.ratingScore,
      weight: weights.ratingScore,
      contribution: output.ratingScore * weights.ratingScore,
      reason: getRatingReason(output.ratingScore),
      level: getLevel(output.ratingScore),
    },
    {
      component: "reviewCount",
      score: output.reviewCountScore,
      weight: weights.reviewCountScore,
      contribution: output.reviewCountScore * weights.reviewCountScore,
      reason: getReviewReason(output.reviewCountScore),
      level: getLevel(output.reviewCountScore),
    },
    {
      component: "soldCount",
      score: output.soldCountScore,
      weight: weights.soldCountScore,
      contribution: output.soldCountScore * weights.soldCountScore,
      reason: getSoldReason(output.soldCountScore),
      level: getLevel(output.soldCountScore),
    },
    {
      component: "price",
      score: output.priceScore,
      weight: weights.priceScore,
      contribution: output.priceScore * weights.priceScore,
      reason: getPriceReason(output.priceScore),
      level: getLevel(output.priceScore),
    },
    {
      component: "shopTrust",
      score: output.shopTrustScore,
      weight: weights.shopTrustScore,
      contribution: output.shopTrustScore * weights.shopTrustScore,
      reason: getShopReason(output.shopTrustScore),
      level: getLevel(output.shopTrustScore),
    },
    {
      component: "responseRate",
      score: output.responseRateScore,
      weight: weights.responseRateScore,
      contribution: output.responseRateScore * weights.responseRateScore,
      reason: getResponseReason(output.responseRateScore),
      level: getLevel(output.responseRateScore),
    },
    {
      component: "featureMatch",
      score: output.featureMatchScore,
      weight: weights.featureMatchScore,
      contribution: output.featureMatchScore * weights.featureMatchScore,
      reason: getFeatureReason(output.featureMatchScore),
      level: getLevel(output.featureMatchScore),
    },
  ];
  return items;
}

function getLevel(score: number): "low" | "medium" | "high" {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

function getRatingReason(score: number): string {
  if (score >= 0.9) return "Excellent rating (>= 4.5/5)";
  if (score >= 0.8) return "Very good rating (4.0-4.5/5)";
  if (score >= 0.6) return "Good rating (3.0-4.0/5)";
  if (score > 0) return "Below average rating";
  return "No rating data available";
}

function getReviewReason(score: number): string {
  if (score >= 0.8) return "Many reviews (high social proof)";
  if (score >= 0.5) return "Moderate number of reviews";
  if (score > 0) return "Few reviews";
  return "No reviews";
}

function getSoldReason(score: number): string {
  if (score >= 0.8) return "High sales volume (popular product)";
  if (score >= 0.5) return "Moderate sales volume";
  if (score > 0) return "Low sales volume";
  return "No sales data";
}

function getPriceReason(score: number): string {
  if (score >= 0.8) return "Very competitive price";
  if (score >= 0.5) return "Reasonable price";
  if (score > 0) return "Premium price";
  return "No price data";
}

function getShopReason(score: number): string {
  if (score >= 0.9) return "Official/Mall store (highest trust)";
  if (score >= 0.7) return "Star+ or Star seller (high trust)";
  if (score >= 0.5) return "Preferred seller (good trust)";
  return "Regular or unknown seller";
}

function getResponseReason(score: number): string {
  if (score >= 0.9) return "Excellent response rate (>= 90%)";
  if (score >= 0.7) return "Good response rate";
  if (score > 0) return "Moderate response rate";
  return "No response data";
}

function getFeatureReason(score: number): string {
  if (score >= 0.8) return "Many features matching requirements";
  if (score >= 0.5) return "Some features matching";
  if (score >= 0.3) return "Few features";
  return "No matching features";
}
