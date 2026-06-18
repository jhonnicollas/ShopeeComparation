import { describe, expect, it } from "vitest";
import { WeightExtractor } from "./weightExtractor.js";

const extractor = new WeightExtractor();

describe("WeightExtractor", () => {
  it("returns empty when no text provided", () => {
    const result = extractor.extractWeight({ text: "" });
    expect(result.value).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("extracts weight in grams", () => {
    const result = extractor.extractWeight({ text: "Berat produk 500g" });
    expect(result.value).toBe(500);
    expect(result.unit).toBe("gram");
  });

  it("extracts weight in kilograms", () => {
    const result = extractor.extractWeight({ text: "Berat: 1.5 kg" });
    expect(result.value).toBe(1.5);
    expect(result.unit).toBe("kg");
  });

  it("extracts weight in milligrams", () => {
    const result = extractor.extractWeight({ text: "Berat: 250 mg" });
    expect(result.value).toBe(250);
    expect(result.unit).toBe("mg");
  });

  it("extracts weight in pounds", () => {
    const result = extractor.extractWeight({ text: "Weight: 2 lbs" });
    expect(result.value).toBe(2);
    expect(result.unit).toBe("lb");
  });

  it("extracts weight in ounces", () => {
    const result = extractor.extractWeight({ text: "Weight: 8 oz" });
    expect(result.value).toBe(8);
    expect(result.unit).toBe("oz");
  });  it("extracts weight from berat pattern", () => {
    const result = extractor.extractWeight({ text: "berat: 750g" });
    expect(result.value).toBe(750);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("extracts weight from weight pattern", () => {
    const result = extractor.extractWeight({ text: "weight: 1200 g" });
    expect(result.value).toBe(1200);
    expect(result.unit).toBe("gram");
  });

  it("preserves original unit for grams", () => {
    const result = extractor.extractWeight({ text: "Berat: 500g" });
    expect(result.value).toBe(500);
    expect(result.unit).toBe("gram");
  });

  it("preserves original unit for kilograms", () => {
    const result = extractor.extractWeight({ text: "Berat: 1.5 kg" });
    expect(result.value).toBe(1.5);
    expect(result.unit).toBe("kg");
  });

  it("extracts decimal weight", () => {
    const result = extractor.extractWeight({ text: "Berat: 0.5 kg" });
    expect(result.value).toBe(0.5);
    expect(result.unit).toBe("kg");
  });

  it("extracts weight with comma decimal", () => {
    const result = extractor.extractWeight({ text: "Berat: 1,5 kg" });
    expect(result.value).toBe(1.5);
    expect(result.unit).toBe("kg");
  });

  it("detects source from sourceContext specification", () => {
    const result = extractor.extractWeight({
      text: "500g",
      sourceContext: "product specification",
    });
    expect(result.source).toBe("productSpecification");
  });

  it("detects source from description context", () => {
    const result = extractor.extractWeight({
      text: "500g",
      sourceContext: "product description",
    });
    expect(result.source).toBe("description");
  });

  it("detects source from variant context", () => {
    const result = extractor.extractWeight({
      text: "500g",
      sourceContext: "product variant",
    });
    expect(result.source).toBe("variant");
  });

  it("detects source from shipping context", () => {
    const result = extractor.extractWeight({
      text: "500g",
      sourceContext: "shipping info",
    });
    expect(result.source).toBe("shipping");
  });

  it("returns empty when no weight found", () => {
    const result = extractor.extractWeight({ text: "Some text without weight" });
    expect(result.value).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("picks highest confidence match when multiple found", () => {
    const result = extractor.extractWeight({
      text: "100g and 1.5kg",
      sourceContext: "product specification",
    });
    expect(result.value).toBe(1.5);
    expect(result.unit).toBe("kg");
  });

  it("stores raw text", () => {
    const result = extractor.extractWeight({ text: "Berat: 500g" });
    expect(result.rawText).toContain("500g");
  });

  it("does not invent values when input is invalid", () => {
    const result = extractor.extractWeight({ text: "Berat: 0g" });
    expect(result.value).toBeNull();
  });
});
