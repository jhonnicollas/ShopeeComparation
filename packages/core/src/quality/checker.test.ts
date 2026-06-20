import { describe, expect, it } from "vitest";
import type { ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";
import { checkDataQuality } from "./checker.js";

const baseProduct: ProductSnapshot = {
  shopeeItemId: "item-1",
  shopeeShopId: "shop-1",
  title: "Test",
  brand: "TestBrand",
  category: "TestCat",
  originalUrl: null,
  canonicalUrl: null,
  imageUrl: "https://example.com/img.jpg",
  galleryJson: null,
  videoUrl: null,
  priceMin: 100000,
  priceMax: 150000,
  priceBeforeDiscount: null,
  discountText: null,
  rating: 4.5,
  reviewCount: 500,
  soldCount: 1000,
  favoriteCount: 50,
  stock: 10,
  shippedFrom: "DKI Jakarta",
  description: "Test description",
  specificationJson: { brand: "Test" },
  variationJson: null,
  weight: { value: 500, unit: "gram", rawText: "500g", source: "test", confidence: 1 },
  features: [{ name: "F1", value: "V1", source: "test", confidence: 1 }],
  confidenceScore: 0.9,
};

const baseShop: ShopSnapshot = {
  shopeeShopId: "shop-1",
  name: "Test Shop",
  shopUrl: "https://shopee.co.id/shop-1",
  statusLabels: [],
  primaryStatus: "MALL",
  rating: 4.8,
  ratingCount: 1000,
  responseRate: 95,
  responseTime: null,
  followerCount: null,
  productCount: null,
  joinedAgeText: null,
  location: "Jakarta",
  confidenceScore: 0.9,
};

describe("checkDataQuality", () => {
  it("returns array of DataQualityField", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]?.fieldName).toBeDefined();
  });

  it("marks available fields as available", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    const rating = fields.find((f) => f.fieldName === "rating");
    expect(rating?.status).toBe("available");
    expect(rating?.value).toBe("4.5");
  });

  it("marks missing fields as unavailable", () => {
    const sparse: ProductSnapshot = { ...baseProduct, brand: null, category: null };
    const fields = checkDataQuality({ product: sparse, shop: baseShop });
    const brand = fields.find((f) => f.fieldName === "brand");
    expect(brand?.status).toBe("unavailable");
  });

  it("marks missing shop fields as unavailable when shop is null", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: null });
    const shopName = fields.find((f) => f.fieldName === "shopName");
    expect(shopName?.status).toBe("unavailable");
  });

  it("sets source for product fields", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    const rating = fields.find((f) => f.fieldName === "rating");
    expect(rating?.source).toBe("extracted");
  });

  it("sets shop-extracted source for shop fields", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    const shopName = fields.find((f) => f.fieldName === "shopName");
    expect(shopName?.source).toBe("shop-extracted");
  });

  it("includes features as count string", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    const features = fields.find((f) => f.fieldName === "features");
    expect(features?.value).toBe("1 features");
    expect(features?.status).toBe("available");
  });

  it("counts available fields for completeness", () => {
    const fields = checkDataQuality({ product: baseProduct, shop: baseShop });
    const available = fields.filter((f) => f.status === "available").length;
    const total = fields.length;
    expect(available).toBeGreaterThan(total / 2);
  });
});
