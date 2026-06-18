import { describe, expect, it } from "vitest";
import {
  shopFixtures,
  findShopFixtureById,
  findShopFixtureByShopeeId,
} from "./shops.js";

describe("shopFixtures", () => {
  it("contains at least 3 shops", () => {
    expect(shopFixtures.length).toBeGreaterThanOrEqual(3);
  });

  it("all shops have required fields", () => {
    for (const s of shopFixtures) {
      expect(s.shopId).toBeDefined();
      expect(s.name).toBeDefined();
      expect(s.primaryStatus).toBeDefined();
      expect(s.rating).toBeGreaterThan(0);
      expect(s.rating).toBeLessThanOrEqual(5);
      expect(s.responseRate).toBeGreaterThanOrEqual(0);
      expect(s.responseRate).toBeLessThanOrEqual(100);
    }
  });

  it("all shops are in DKI Jakarta", () => {
    for (const s of shopFixtures) {
      expect(s.location).toBe("DKI Jakarta");
    }
  });

  it("has shops with diverse statuses", () => {
    const statuses = new Set(shopFixtures.map((s) => s.primaryStatus));
    expect(statuses.size).toBeGreaterThanOrEqual(3);
  });

  it("has shops with high trust ratings", () => {
    for (const s of shopFixtures) {
      expect(s.rating).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("findShopFixtureById", () => {
  it("returns shop for valid id", () => {
    const result = findShopFixtureById("shop-001");
    expect(result?.name).toContain("Omron");
  });

  it("returns null for invalid id", () => {
    expect(findShopFixtureById("invalid")).toBeNull();
  });
});

describe("findShopFixtureByShopeeId", () => {
  it("returns shop for valid shopee id", () => {
    const result = findShopFixtureByShopeeId("shopee-shop-001");
    expect(result?.shopId).toBe("shop-001");
  });

  it("returns null for invalid shopee id", () => {
    expect(findShopFixtureByShopeeId("invalid")).toBeNull();
  });
});
