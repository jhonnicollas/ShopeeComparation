import { describe, expect, it } from "vitest";
import { FeatureExtractor } from "./featureExtractor.js";

const extractor = new FeatureExtractor();

describe("FeatureExtractor", () => {
  it("returns empty array when no input provided", () => {
    const result = extractor.extractFeatures({});
    expect(result).toEqual([]);
  });

  it("extracts from HTML table", () => {
    const html = `
      <table>
        <tr><th>Material</th><td>Stainless Steel</td></tr>
        <tr><th>Color</th><td>Black</td></tr>
        <tr><th>Weight</th><td>500g</td></tr>
      </table>
    `;
    const result = extractor.extractFeatures({ html });
    expect(result.length).toBeGreaterThanOrEqual(3);
    const material = result.find((f) => f.name === "material");
    expect(material?.value).toBe("Stainless Steel");
    expect(material?.source).toBe("productSpecification");
  });

  it("extracts from HTML list with colon pattern", () => {
    const html = `
      <ul>
        <li>Warna: Merah</li>
        <li>Ukuran: 42</li>
      </ul>
    `;
    const result = extractor.extractFeatures({ html });
    expect(result.length).toBeGreaterThanOrEqual(2);
    const warna = result.find((f) => f.name === "warna");
    expect(warna?.value).toBe("Merah");
  });

  it("extracts from JSON with features array", () => {
    const json = {
      features: [
        { name: "Material", value: "Cotton" },
        { name: "Size", value: "L" },
      ],
    };
    const result = extractor.extractFeatures({ json });
    expect(result.length).toBe(2);
    expect(result[0]?.name).toBe("Material");
    expect(result[0]?.value).toBe("Cotton");
    expect(result[0]?.source).toBe("productSpecification");
  });

  it("extracts from JSON with specifications object", () => {
    const json = {
      specifications: {
        material: "Stainless Steel",
        color: "Black",
        dimensions: "10x10x5 cm",
      },
    };
    const result = extractor.extractFeatures({ json });
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.some((f) => f.name === "material" && f.value === "Stainless Steel")).toBe(true);
  });

  it("extracts from JSON with flat key-value", () => {
    const json = {
      material: "Steel",
      color: "Red",
      warranty: "1 year",
    };
    const result = extractor.extractFeatures({ json });
    expect(result.length).toBe(3);
    expect(result[0]?.source).toBe("metadata");
  });

  it("extracts from text with colon pattern", () => {
    const text = `Material: Stainless Steel
Color: Black
Weight: 500g`;
    const result = extractor.extractFeatures({ text });
    expect(result.length).toBeGreaterThanOrEqual(3);
    const material = result.find((f) => f.name === "material");
    expect(material?.value).toBe("Stainless Steel");
  });

  it("extracts from description with fitur pattern", () => {
    const text = "Fitur: waterproof, anti slip, ringan";
    const result = extractor.extractFeatures({ text });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((f) => f.value === "waterproof")).toBe(true);
  });

  it("deduplicates features with same name and value", () => {
    const html = `
      <table>
        <tr><th>Material</th><td>Steel</td></tr>
        <tr><th>Material</th><td>Steel</td></tr>
      </table>
    `;
    const result = extractor.extractFeatures({ html });
    const materialCount = result.filter((f) => f.name === "material").length;
    expect(materialCount).toBe(1);
  });

  it("returns empty for no matches", () => {
    const result = extractor.extractFeatures({ text: "no features here" });
    expect(result).toEqual([]);
  });

  it("handles malformed JSON gracefully", () => {
    const result = extractor.extractFeatures({ json: { features: null } });
    expect(result).toEqual([]);
  });

  it("extracts from HTML, JSON, and text combined", () => {
    const html = `<table><tr><th>Material</th><td>Steel</td></tr></table>`;
    const json = { color: "Black" };
    const text = "Size: Large";
    const result = extractor.extractFeatures({ html, json, text });
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});
