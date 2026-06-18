import { describe, expect, it } from "vitest";
import {
  productFixtures,
  findFixtureByItemId,
  findFixtureByUrl,
} from "./products.js";

describe("productFixtures", () => {
  it("contains at least 5 products", () => {
    expect(productFixtures.length).toBeGreaterThanOrEqual(5);
  });

  it("all products have required fields", () => {
    for (const p of productFixtures) {
      expect(p.itemId).toBeDefined();
      expect(p.shopId).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.priceMin).toBeGreaterThan(0);
      expect(p.priceMax).toBeGreaterThanOrEqual(p.priceMin);
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.shippedFrom).toBe("DKI Jakarta");
    }
  });

  it("has products with diverse price ranges", () => {
    const prices = productFixtures.map((p) => p.priceMin);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    expect(max - min).toBeGreaterThan(100000);
  });

  it("has products with diverse ratings", () => {
    const ratings = productFixtures.map((p) => p.rating);
    const uniqueRatings = new Set(ratings);
    expect(uniqueRatings.size).toBeGreaterThan(2);
  });

  it("all products have weights", () => {
    for (const p of productFixtures) {
      expect(p.weight).toBeDefined();
      expect(p.weight.value).toBeGreaterThan(0);
      expect(p.weight.unit).toBeDefined();
    }
  });

  it("all products have features", () => {
    for (const p of productFixtures) {
      expect(p.features.length).toBeGreaterThan(0);
    }
  });

  it("has products from multiple shops", () => {
    const shops = new Set(productFixtures.map((p) => p.shopId));
    expect(shops.size).toBeGreaterThan(1);
  });
});

describe("findFixtureByItemId", () => {
  it("returns fixture for valid itemId", () => {
    const result = findFixtureByItemId("item-001");
    expect(result?.title).toContain("Tensimeter");
  });

  it("returns null for invalid itemId", () => {
    const result = findFixtureByItemId("item-nonexistent");
    expect(result).toBeNull();
  });
});

describe("findFixtureByUrl", () => {
  it("returns fixture for valid URL", () => {
    const result = findFixtureByUrl("https://shopee.co.id/product-1");
    expect(result?.itemId).toBe("item-001");
  });

  it("returns null for invalid URL", () => {
    const result = findFixtureByUrl("https://example.com/not-found");
    expect(result).toBeNull();
  });
});
