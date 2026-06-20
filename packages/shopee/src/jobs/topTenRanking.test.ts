import { describe, expect, it } from "vitest";
import { rankTopN } from "./topTenRanking.js";
import { emptyProduct, emptyShop } from "../extractors/fallbackExtractor.js";
import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";

function makeProduct(overrides: Partial<ProductSnapshot>): ProductSnapshot {
  return {
    ...emptyProduct("0", "", "https://shopee.co.id/p/0"),
    rating: 4.5,
    reviewCount: 100,
    soldCount: 500,
    priceMin: 100000,
    priceMax: 150000,
    features: [],
    ...overrides,
  };
}

function makeShop(overrides: Partial<ShopSnapshot>): ShopSnapshot {
  return {
    ...emptyShop("0"),
    rating: 4.5,
    responseRate: 90,
    followerCount: 1000,
    primaryStatus: "STAR",
    ...overrides,
  };
}

describe("rankTopN", () => {
  it("returns empty array when no items", () => {
    expect(rankTopN([], 10)).toEqual([]);
  });

  it("ranks items by score descending", () => {
    const items = [
      { product: makeProduct({ shopeeItemId: "low", shopeeShopId: "1", rating: 3.0, reviewCount: 10, soldCount: 50, priceMin: 200000, priceMax: 250000 }), shop: makeShop({ shopeeShopId: "1", rating: 3.0, responseRate: 60 }) },
      { product: makeProduct({ shopeeItemId: "high", shopeeShopId: "2", rating: 4.9, reviewCount: 500, soldCount: 2000, priceMin: 100000, priceMax: 100000 }), shop: makeShop({ shopeeShopId: "2", rating: 4.9, responseRate: 99, primaryStatus: "MALL" }) },
      { product: makeProduct({ shopeeItemId: "mid", shopeeShopId: "3", rating: 4.0, reviewCount: 200, soldCount: 500, priceMin: 150000, priceMax: 150000 }), shop: makeShop({ shopeeShopId: "3", rating: 4.2, responseRate: 85 }) },
    ];
    const result = rankTopN(items, 10);
    expect(result).toHaveLength(3);
    expect(result[0]?.productId).toBe("high");
    expect(result[1]?.productId).toBe("mid");
    expect(result[2]?.productId).toBe("low");
    expect(result[0]?.rank).toBe(1);
    expect(result[1]?.rank).toBe(2);
    expect(result[2]?.rank).toBe(3);
  });

  it("respects limit", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      product: makeProduct({
        shopeeItemId: String(i),
        shopeeShopId: String(i),
        rating: 4.5,
        reviewCount: 100 + i,
        soldCount: 500,
        priceMin: 100000,
        priceMax: 100000,
      }),
      shop: makeShop({ shopeeShopId: String(i), rating: 4.5, responseRate: 90 }),
    }));
    const result = rankTopN(items, 5);
    expect(result).toHaveLength(5);
  });

  it("ties broken by itemId alphabetical", () => {
    const items = [
      { product: makeProduct({ shopeeItemId: "c", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
      { product: makeProduct({ shopeeItemId: "a", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
      { product: makeProduct({ shopeeItemId: "b", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
    ];
    const result = rankTopN(items, 3);
    expect(result.map((r) => r.productId)).toEqual(["a", "b", "c"]);
  });

  it("uses deterministic tiebreak for identical scores", () => {
    const items = [
      { product: makeProduct({ shopeeItemId: "z", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
      { product: makeProduct({ shopeeItemId: "a", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
    ];
    const result = rankTopN(items, 2);
    expect(result[0]?.productId).toBe("a");
    expect(result[1]?.productId).toBe("z");
  });

  it("handles items with null shop", () => {
    const items = [
      { product: makeProduct({ shopeeItemId: "1", shopeeShopId: "1", rating: 4.0 }), shop: null },
    ];
    const result = rankTopN(items, 10);
    expect(result).toHaveLength(1);
    expect(result[0]?.shop).toBeNull();
  });

  it("handles missing itemId", () => {
    const items = [
      { product: makeProduct({ shopeeItemId: "", shopeeShopId: "1" }), shop: makeShop({ shopeeShopId: "1" }) },
    ];
    const result = rankTopN(items, 10);
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("");
  });

  it("assigns ranks 1..N", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      product: makeProduct({ shopeeItemId: String(i), shopeeShopId: String(i) }),
      shop: makeShop({ shopeeShopId: String(i) }),
    }));
    const result = rankTopN(items, 5);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("respects limit of 0", () => {
    const items = [{ product: makeProduct({ shopeeItemId: "1" }), shop: makeShop({ shopeeShopId: "1" }) }];
    expect(rankTopN(items, 0)).toEqual([]);
  });

  it("respects limit larger than items", () => {
    const items = [{ product: makeProduct({ shopeeItemId: "1" }), shop: makeShop({ shopeeShopId: "1" }) }];
    const result = rankTopN(items, 10);
    expect(result).toHaveLength(1);
  });
});
