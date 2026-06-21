import { describe, expect, it } from "vitest";
import { runResearchWorkflow, researchWorkflow, riskAnalyzerAgent, recommendationWriterAgent } from "./researchWorkflow.js";
import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";

function mockDb(): D1Database {
  const stmt = {
    bind: () => stmt,
    first: () => Promise.resolve(null),
    run: () => Promise.resolve({ success: true }),
    all: () => Promise.resolve({ results: [] }),
  };
  return { prepare: () => stmt } as unknown as D1Database;
}

describe("researchWorkflow", () => {
  it("uses real Mastra primitives", () => {
    expect(researchWorkflow).toBeDefined();
    expect(riskAnalyzerAgent).toBeDefined();
    expect(recommendationWriterAgent).toBeDefined();
    expect(typeof researchWorkflow.execute).toBe("function");
  });

  it("runs end-to-end and aggregates report + risk profile", async () => {
    const products: ProductSnapshot[] = [
      {
        shopeeItemId: "p1",
        shopeeShopId: "s1",
        title: "Tensimeter Digital A",
        brand: null,
        category: null,
        originalUrl: null,
        canonicalUrl: null,
        imageUrl: null,
        galleryJson: null,
        videoUrl: null,
        priceMin: 250000,
        priceMax: null,
        priceBeforeDiscount: null,
        discountText: null,
        rating: 4.7,
        reviewCount: 500,
        soldCount: 1000,
        favoriteCount: null,
        stock: null,
        shippedFrom: "DKI Jakarta",
        description: null,
        specificationJson: null,
        variationJson: null,
        weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
        features: [],
        confidenceScore: 0.8,
      },
      {
        shopeeItemId: "p2",
        shopeeShopId: "s2",
        title: "Tensimeter Digital B",
        brand: null,
        category: null,
        originalUrl: null,
        canonicalUrl: null,
        imageUrl: null,
        galleryJson: null,
        videoUrl: null,
        priceMin: 180000,
        priceMax: null,
        priceBeforeDiscount: null,
        discountText: null,
        rating: 4.2,
        reviewCount: 50,
        soldCount: 100,
        favoriteCount: null,
        stock: null,
        shippedFrom: "DKI Jakarta",
        description: null,
        specificationJson: null,
        variationJson: null,
        weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
        features: [],
        confidenceScore: 0.6,
      },
    ];
    const shops = new Map<string, ShopSnapshot>([
      ["s1", {
        shopeeShopId: "s1", name: "Toko A", shopUrl: null, statusLabels: [],
        primaryStatus: "MALL", rating: 4.9, ratingCount: 1000, responseRate: 98, responseTime: "1 jam",
        followerCount: 5000, productCount: 200, joinedAgeText: "5 tahun", location: "Jakarta",
        confidenceScore: 0.9,
      }],
      ["s2", {
        shopeeShopId: "s2", name: "Toko B", shopUrl: null, statusLabels: [],
        primaryStatus: "REGULAR", rating: 4.5, ratingCount: 100, responseRate: 80, responseTime: "3 jam",
        followerCount: 500, productCount: 50, joinedAgeText: "1 tahun", location: "Bandung",
        confidenceScore: 0.7,
      }],
    ]);

    const result = await runResearchWorkflow({
      db: mockDb(),
      env: {},
      userQuery: "tensimeter digital",
      products,
      shops,
    });

    expect(result.usedMastra).toBe(true);
    expect(result.workflowId).toBe("shopee-research-workflow");
    expect(result.stepCount).toBe(3);
    expect(result.productRisks).toHaveLength(2);
    expect(result.report).toBeDefined();
    expect(result.report.ranking).toHaveLength(2);
    expect(result.rawText.length).toBeGreaterThan(0);
  });
});
