import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";
import { calculateProductScore } from "@shopee-research/core";

export interface RankInput {
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

export interface RankedResult {
  rank: number;
  productId: string;
  score: number;
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

interface ScoredItem {
  productId: string;
  score: number;
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

function buildScoringInput(item: RankInput) {
  return {
    productId: item.product.shopeeItemId ?? "",
    rating: item.product.rating,
    reviewCount: item.product.reviewCount,
    soldCount: item.product.soldCount,
    priceMin: item.product.priceMin,
    priceMax: item.product.priceMax,
    shopStatus: item.shop?.primaryStatus ?? null,
    shopRating: item.shop?.rating ?? null,
    responseRate: item.shop?.responseRate ?? null,
    featureCount: item.product.features?.length ?? 0,
    featureMatchCount: 0,
    risks: [],
  };
}

export function rankTopN(items: RankInput[], limit: number): RankedResult[] {
  if (items.length === 0) return [];
  const effectiveLimit = Math.max(0, Math.min(limit, items.length));

  const scored: ScoredItem[] = items.map((item) => {
    const output = calculateProductScore(buildScoringInput(item));
    const productId = item.product.shopeeItemId ?? "";
    return {
      productId,
      score: output.finalScore,
      product: item.product,
      shop: item.shop,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.productId && b.productId) {
      return a.productId.localeCompare(b.productId);
    }
    return 0;
  });

  return scored.slice(0, effectiveLimit).map((item, idx) => ({
    rank: idx + 1,
    productId: item.productId,
    score: item.score,
    product: item.product,
    shop: item.shop,
  }));
}
