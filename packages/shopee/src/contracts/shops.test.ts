import { describe, expect, it } from "vitest";
import { isValidShopSnapshot, getShopTrustLevel } from "./shops.js";

describe("isValidShopSnapshot", () => {
  it("returns true for valid snapshot", () => {
    const valid = {
      shopeeShopId: "shop-1",
      name: "Test Shop",
      confidenceScore: 0.9,
    };
    expect(isValidShopSnapshot(valid)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidShopSnapshot(null)).toBe(false);
  });

  it("returns false for missing fields", () => {
    expect(isValidShopSnapshot({})).toBe(false);
    expect(isValidShopSnapshot({ shopeeShopId: "x" })).toBe(false);
  });
});

describe("getShopTrustLevel", () => {
  it("returns high for MALL", () => {
    expect(getShopTrustLevel("MALL", 4.5, 90)).toBe("high");
  });

  it("returns high for OFFICIAL", () => {
    expect(getShopTrustLevel("OFFICIAL", 4.5, 90)).toBe("high");
  });

  it("returns high for high rating and response rate", () => {
    expect(getShopTrustLevel("REGULAR", 4.8, 96)).toBe("high");
  });

  it("returns medium for STARPLUS", () => {
    expect(getShopTrustLevel("STARPLUS", 4.5, 90)).toBe("medium");
  });

  it("returns medium for STAR", () => {
    expect(getShopTrustLevel("STAR", 4.5, 90)).toBe("medium");
  });

  it("returns medium for moderate metrics", () => {
    expect(getShopTrustLevel("REGULAR", 4.5, 88)).toBe("medium");
  });

  it("returns low for low metrics", () => {
    expect(getShopTrustLevel("REGULAR", 3.5, 70)).toBe("low");
  });

  it("returns low for null primaryStatus with low values", () => {
    expect(getShopTrustLevel(null, 3.0, 50)).toBe("low");
  });
});
