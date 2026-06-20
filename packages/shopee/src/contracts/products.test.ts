import { describe, expect, it } from "vitest";
import { isValidProductSnapshot, getConfidenceLevel } from "./products.js";

describe("isValidProductSnapshot", () => {
  it("returns true for valid snapshot", () => {
    const valid = {
      shopeeItemId: "item-1",
      features: [],
      weight: { value: 100, unit: "gram", rawText: "100g", source: "test", confidence: 1 },
      confidenceScore: 0.9,
    };
    expect(isValidProductSnapshot(valid)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidProductSnapshot(null)).toBe(false);
  });

  it("returns false for missing fields", () => {
    expect(isValidProductSnapshot({})).toBe(false);
    expect(isValidProductSnapshot({ shopeeItemId: "x" })).toBe(false);
  });
});

describe("getConfidenceLevel", () => {
  it("returns high for >= 0.8", () => {
    expect(getConfidenceLevel(0.8)).toBe("high");
    expect(getConfidenceLevel(1.0)).toBe("high");
  });

  it("returns medium for 0.5-0.8", () => {
    expect(getConfidenceLevel(0.5)).toBe("medium");
    expect(getConfidenceLevel(0.7)).toBe("medium");
  });

  it("returns low for < 0.5", () => {
    expect(getConfidenceLevel(0.3)).toBe("low");
    expect(getConfidenceLevel(0)).toBe("low");
  });
});
