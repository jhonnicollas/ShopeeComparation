import { describe, expect, it } from "vitest";
import { CandidateCollector } from "./candidateCollector.js";
import type { SearchInput, SearchProvider, SearchResultCandidate } from "@shopee-research/shared";

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
    shippedFrom: "DKI Jakarta",
    shopName: null,
    source: "test",
    confidence: 0.5,
    ...overrides,
  };
}

function makeProvider(
  key: string,
  results: SearchResultCandidate[] | Error
): SearchProvider {
  return {
    key,
    search: results instanceof Error
      ? async () => {
          throw results;
        }
      : async () => results,
  };
}

const baseInput: SearchInput = {
  keyword: "laptop",
  shippedFrom: "DKI Jakarta",
  limit: 10,
};

describe("CandidateCollector", () => {
  it("returns empty when no providers", async () => {
    const collector = new CandidateCollector({ providers: [] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toEqual([]);
    expect(result.perProviderCount).toEqual({});
    expect(result.failedProviders).toEqual([]);
  });

  it("collects from a single provider", async () => {
    const provider = makeProvider("p1", [
      makeCandidate({ itemId: "1", shopId: "1", title: "P1", confidence: 0.7 }),
      makeCandidate({ itemId: "2", shopId: "2", title: "P2", confidence: 0.6 }),
    ]);
    const collector = new CandidateCollector({ providers: [provider] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(2);
    expect(result.perProviderCount).toEqual({ p1: 2 });
    expect(result.failedProviders).toEqual([]);
  });

  it("collects from multiple providers", async () => {
    const p1 = makeProvider("p1", [
      makeCandidate({ itemId: "1", shopId: "1", confidence: 0.7 }),
    ]);
    const p2 = makeProvider("p2", [
      makeCandidate({ itemId: "2", shopId: "2", confidence: 0.6 }),
    ]);
    const collector = new CandidateCollector({ providers: [p1, p2] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(2);
    expect(result.perProviderCount).toEqual({ p1: 1, p2: 1 });
  });

  it("deduplicates by shopId+itemId", async () => {
    const p1 = makeProvider("p1", [
      makeCandidate({ itemId: "1", shopId: "1", title: "From p1", confidence: 0.5 }),
    ]);
    const p2 = makeProvider("p2", [
      makeCandidate({ itemId: "1", shopId: "1", title: "From p2", confidence: 0.8 }),
    ]);
    const collector = new CandidateCollector({ providers: [p1, p2] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.title).toBe("From p2");
  });

  it("deduplicates by canonicalUrl when no shopId/itemId", async () => {
    const p1 = makeProvider("p1", [
      makeCandidate({ canonicalUrl: "https://shopee.co.id/p/123", title: "P1", confidence: 0.5 }),
    ]);
    const p2 = makeProvider("p2", [
      makeCandidate({ canonicalUrl: "https://shopee.co.id/p/123", title: "P2", confidence: 0.7 }),
    ]);
    const collector = new CandidateCollector({ providers: [p1, p2] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.title).toBe("P2");
  });

  it("deduplicates by originalUrl when no shopId/itemId or canonicalUrl", async () => {
    const p1 = makeProvider("p1", [
      makeCandidate({ originalUrl: "https://shopee.co.id/p/123", title: "P1", confidence: 0.5 }),
    ]);
    const p2 = makeProvider("p2", [
      makeCandidate({ originalUrl: "https://shopee.co.id/p/123", title: "P2", confidence: 0.7 }),
    ]);
    const collector = new CandidateCollector({ providers: [p1, p2] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.title).toBe("P2");
  });

  it("respects the limit", async () => {
    const provider = makeProvider(
      "p1",
      Array.from({ length: 20 }, (_, i) =>
        makeCandidate({
          itemId: String(i),
          shopId: String(i),
          title: `P${i}`,
          confidence: 0.5 + i * 0.01,
        })
      )
    );
    const collector = new CandidateCollector({ providers: [provider] });
    const result = await collector.collect({ ...baseInput, limit: 5 });
    expect(result.candidates).toHaveLength(5);
  });

  it("sorts by confidence descending before limiting", async () => {
    const provider = makeProvider("p1", [
      makeCandidate({ itemId: "1", shopId: "1", confidence: 0.3 }),
      makeCandidate({ itemId: "2", shopId: "2", confidence: 0.9 }),
      makeCandidate({ itemId: "3", shopId: "3", confidence: 0.6 }),
    ]);
    const collector = new CandidateCollector({ providers: [provider] });
    const result = await collector.collect({ ...baseInput, limit: 2 });
    expect(result.candidates[0]?.itemId).toBe("2");
    expect(result.candidates[1]?.itemId).toBe("3");
  });

  it("handles provider failure gracefully", async () => {
    const p1 = makeProvider("p1", new Error("boom"));
    const p2 = makeProvider("p2", [
      makeCandidate({ itemId: "1", shopId: "1", confidence: 0.5 }),
    ]);
    const collector = new CandidateCollector({ providers: [p1, p2] });
    const result = await collector.collect(baseInput);
    expect(result.candidates).toHaveLength(1);
    expect(result.failedProviders).toContain("p1");
    expect(result.failedProviders).not.toContain("p2");
    expect(result.perProviderCount.p1).toBe(0);
    expect(result.perProviderCount.p2).toBe(1);
  });

  it("uses default limit of 10 when limit is 0 or negative", async () => {
    const provider = makeProvider(
      "p1",
      Array.from({ length: 20 }, (_, i) =>
        makeCandidate({ itemId: String(i), shopId: String(i), confidence: 0.5 })
      )
    );
    const collector = new CandidateCollector({ providers: [provider] });
    const result = await collector.collect({ ...baseInput, limit: 0 });
    expect(result.candidates.length).toBeLessThanOrEqual(10);
  });
});
