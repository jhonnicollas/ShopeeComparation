import { describe, expect, it } from "vitest";
import { filterByShippedFrom } from "./shippedFromFilter.js";
import type { SearchResultCandidate } from "@shopee-research/shared";

function makeCandidate(overrides: Partial<SearchResultCandidate>): SearchResultCandidate {
  return {
    title: null,
    originalUrl: null,
    canonicalUrl: null,
    itemId: null,
    shopId: null,
    priceMin: null,
    priceMax: null,
    rating: null,
    reviewCount: null,
    soldCount: null,
    shippedFrom: null,
    shopName: null,
    source: "test",
    confidence: 0.5,
    ...overrides,
  };
}

describe("filterByShippedFrom", () => {
  it("keeps candidates matching shippedFrom", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shopId: "1", shippedFrom: "DKI Jakarta" }),
      makeCandidate({ itemId: "2", shopId: "2", shippedFrom: "DKI Jakarta" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.kept).toHaveLength(2);
    expect(result.dropped).toHaveLength(0);
    expect(result.keptCount).toBe(2);
    expect(result.droppedCount).toBe(0);
  });

  it("drops candidates with null shippedFrom", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: null }),
      makeCandidate({ itemId: "2", shippedFrom: "DKI Jakarta" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.kept).toHaveLength(1);
    expect(result.dropped).toHaveLength(1);
    expect(result.dropped[0]?.itemId).toBe("1");
  });

  it("drops candidates with non-matching shippedFrom", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "Jawa Barat" }),
      makeCandidate({ itemId: "2", shippedFrom: "DKI Jakarta" }),
      makeCandidate({ itemId: "3", shippedFrom: "Bali" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]?.itemId).toBe("2");
    expect(result.dropped).toHaveLength(2);
  });

  it("matches case-insensitively", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "dki jakarta" }),
      makeCandidate({ itemId: "2", shippedFrom: "DKI JAKARTA" }),
      makeCandidate({ itemId: "3", shippedFrom: "Dki Jakarta" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.kept).toHaveLength(3);
  });

  it("matches case-insensitively when filter has different case", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "DKI Jakarta" }),
      makeCandidate({ itemId: "2", shippedFrom: "Jawa Barat" }),
    ];
    const result = filterByShippedFrom(candidates, "dki jakarta");
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]?.itemId).toBe("1");
  });

  it("trims whitespace in candidates and filter", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "  DKI Jakarta  " }),
      makeCandidate({ itemId: "2", shippedFrom: "DKI Jakarta" }),
    ];
    const result = filterByShippedFrom(candidates, "  DKI Jakarta  ");
    expect(result.kept).toHaveLength(2);
  });

  it("handles empty candidate list", () => {
    const result = filterByShippedFrom([], "DKI Jakarta");
    expect(result.kept).toEqual([]);
    expect(result.dropped).toEqual([]);
    expect(result.keptCount).toBe(0);
    expect(result.droppedCount).toBe(0);
  });

  it("drops all candidates when no shippedFrom match", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "Jawa Barat" }),
      makeCandidate({ itemId: "2", shippedFrom: "Bali" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.kept).toHaveLength(0);
    expect(result.dropped).toHaveLength(2);
  });

  it("counts kept and dropped correctly", () => {
    const candidates: SearchResultCandidate[] = [
      makeCandidate({ itemId: "1", shippedFrom: "DKI Jakarta" }),
      makeCandidate({ itemId: "2", shippedFrom: null }),
      makeCandidate({ itemId: "3", shippedFrom: "Jawa Barat" }),
    ];
    const result = filterByShippedFrom(candidates, "DKI Jakarta");
    expect(result.keptCount).toBe(1);
    expect(result.droppedCount).toBe(2);
  });
});
