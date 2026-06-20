import { describe, expect, it } from "vitest";
import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";
import { detectRisks } from "./engine.js";

const baseProduct: ProductSnapshot = {
  shopeeItemId: "item-1",
  shopeeShopId: "shop-1",
  title: "Test",
  brand: null,
  category: null,
  originalUrl: null,
  canonicalUrl: null,
  imageUrl: null,
  galleryJson: null,
  videoUrl: null,
  priceMin: 100000,
  priceMax: 150000,
  priceBeforeDiscount: null,
  discountText: null,
  rating: 4.5,
  reviewCount: 500,
  soldCount: 1000,
  favoriteCount: null,
  stock: 50,
  shippedFrom: "DKI Jakarta",
  description: null,
  specificationJson: null,
  variationJson: null,
  weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
  features: [],
  confidenceScore: 1,
};

const baseShop: ShopSnapshot = {
  shopeeShopId: "shop-1",
  name: "Test Shop",
  shopUrl: null,
  statusLabels: [],
  primaryStatus: "STAR",
  rating: 4.5,
  ratingCount: 1000,
  responseRate: 90,
  responseTime: null,
  followerCount: null,
  productCount: null,
  joinedAgeText: null,
  location: "Jakarta",
  confidenceScore: 1,
};

describe("detectRisks", () => {
  it("returns no risks for healthy product", () => {
    const risks = detectRisks({ product: baseProduct, shop: baseShop });
    expect(risks).toHaveLength(0);
  });

  it("detects low rating", () => {
    const risks = detectRisks({
      product: { ...baseProduct, rating: 3.2 },
      shop: baseShop,
    });
    expect(risks.some((r) => r.type === "low_rating")).toBe(true);
  });

  it("detects severe low rating as HIGH", () => {
    const risks = detectRisks({
      product: { ...baseProduct, rating: 2.5 },
      shop: baseShop,
    });
    const lowRating = risks.find((r) => r.type === "low_rating");
    expect(lowRating?.severity).toBe("HIGH");
  });

  it("detects few reviews", () => {
    const risks = detectRisks({
      product: { ...baseProduct, reviewCount: 3 },
      shop: baseShop,
    });
    expect(risks.some((r) => r.type === "few_reviews")).toBe(true);
  });

  it("detects missing shop info", () => {
    const risks = detectRisks({ product: baseProduct, shop: null });
    expect(risks.some((r) => r.type === "shop_unknown")).toBe(true);
  });

  it("detects low response rate", () => {
    const risks = detectRisks({
      product: baseProduct,
      shop: { ...baseShop, responseRate: 25 },
    });
    expect(risks.some((r) => r.type === "low_response_rate")).toBe(true);
  });

  it("detects suspicious discount", () => {
    const risks = detectRisks({
      product: { ...baseProduct, priceMin: 5000, priceBeforeDiscount: 100000 },
      shop: baseShop,
    });
    expect(risks.some((r) => r.type === "suspicious_discount")).toBe(true);
  });

  it("detects out of stock", () => {
    const risks = detectRisks({
      product: { ...baseProduct, stock: 0 },
      shop: baseShop,
    });
    expect(risks.some((r) => r.type === "low_stock")).toBe(true);
  });

  it("detects missing price", () => {
    const risks = detectRisks({
      product: { ...baseProduct, priceMin: null, priceMax: null },
      shop: baseShop,
    });
    expect(risks.some((r) => r.type === "price_missing")).toBe(true);
  });

  it("detects multiple risks", () => {
    const risks = detectRisks({
      product: { ...baseProduct, rating: 2.5, reviewCount: 2, priceMin: null },
      shop: null,
    });
    expect(risks.length).toBeGreaterThanOrEqual(4);
  });
});
