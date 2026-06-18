import type { ProductSnapshot, ScoringOutput } from "@shopee-research/shared";

export interface RankedProduct {
  rank: number;
  product: ProductSnapshot;
  scoring: ScoringOutput;
}

export function rankProducts(
  scoredProducts: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): RankedProduct[] {
  const sorted = [...scoredProducts].sort(compareRankedProducts);
  return sorted.map((item, index) => ({
    rank: index + 1,
    product: item.product,
    scoring: item.scoring,
  }));
}

export function compareRankedProducts(
  a: { product: ProductSnapshot; scoring: ScoringOutput },
  b: { product: ProductSnapshot; scoring: ScoringOutput }
): number {
  const scoreDiff = b.scoring.finalScore - a.scoring.finalScore;
  if (Math.abs(scoreDiff) > 0.001) {
    return scoreDiff;
  }
  const ratingDiff = (b.product.rating ?? 0) - (a.product.rating ?? 0);
  if (Math.abs(ratingDiff) > 0.01) {
    return ratingDiff;
  }
  const reviewDiff = (b.product.reviewCount ?? 0) - (a.product.reviewCount ?? 0);
  if (reviewDiff !== 0) {
    return reviewDiff;
  }
  return (a.product.shopeeItemId ?? "").localeCompare(b.product.shopeeItemId ?? "");
}
