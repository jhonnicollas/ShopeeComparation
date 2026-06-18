import type { ExtractProductInput, ExtractShopInput, ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";
import { findFixtureByUrl, findFixtureByItemId, type ProductFixture } from "../fixtures/products.js";
import { findShopFixtureById, findShopFixtureByShopeeId, type ShopFixture } from "../fixtures/shops.js";

export interface MockExtractResult {
  product: ProductSnapshot | null;
  shop: ShopSnapshot | null;
  warnings: string[];
}

function buildProductSnapshot(fixture: ProductFixture): ProductSnapshot {
  return {
    shopeeItemId: fixture.itemId,
    shopeeShopId: fixture.shopId,
    title: fixture.title,
    brand: fixture.brand,
    category: fixture.category,
    originalUrl: fixture.originalUrl,
    canonicalUrl: fixture.originalUrl,
    imageUrl: fixture.imageUrl,
    galleryJson: fixture.galleryJson,
    description: fixture.description,
    specificationJson: fixture.specificationJson,
    variationJson: null,
    videoUrl: null,
    priceMin: fixture.priceMin,
    priceMax: fixture.priceMax,
    priceBeforeDiscount: fixture.priceBeforeDiscount,
    discountText: fixture.discountText,
    rating: fixture.rating,
    reviewCount: fixture.reviewCount,
    soldCount: fixture.soldCount,
    favoriteCount: fixture.favoriteCount,
    stock: fixture.stock,
    shippedFrom: fixture.shippedFrom,
    weight: {
      value: fixture.weight.value,
      unit: fixture.weight.unit,
      rawText: fixture.weight.rawText,
      source: "mock",
      confidence: 1.0,
    },
    features: fixture.features.map((f) => ({
      name: f.name,
      value: f.value,
      source: "mock",
      confidence: 1.0,
    })),
    confidenceScore: fixture.confidenceScore,
  };
}

function buildShopSnapshot(fixture: ShopFixture): ShopSnapshot {
  return {
    shopeeShopId: fixture.shopeeShopId,
    name: fixture.name,
    shopUrl: fixture.shopUrl,
    statusLabels: fixture.statusLabels,
    primaryStatus: fixture.primaryStatus,
    rating: fixture.rating,
    ratingCount: fixture.ratingCount,
    responseRate: fixture.responseRate,
    responseTime: fixture.responseTime,
    followerCount: fixture.followerCount,
    productCount: fixture.productCount,
    joinedAgeText: fixture.joinedAgeText,
    location: fixture.location,
    confidenceScore: fixture.confidenceScore,
  };
}

export async function mockExtractProduct(input: ExtractProductInput): Promise<ProductSnapshot> {
  const fixture = findFixtureByItemId(input.itemId);
  if (!fixture) {
    throw new Error(`Product not found in fixtures for itemId ${input.itemId}`);
  }
  return buildProductSnapshot(fixture);
}

export async function mockExtractShop(input: ExtractShopInput): Promise<ShopSnapshot> {
  const fixture =
    findShopFixtureById(input.shopId) ?? findShopFixtureByShopeeId(input.shopId);
  if (!fixture) {
    throw new Error(`Shop not found in fixtures for ${input.shopId}`);
  }
  return buildShopSnapshot(fixture);
}

export async function mockExtractByUrl(url: string): Promise<MockExtractResult> {
  const productFixture = findFixtureByUrl(url);
  if (!productFixture) {
    return { product: null, shop: null, warnings: ["URL not found in fixtures"] };
  }
  const product = buildProductSnapshot(productFixture);
  const shopFixture = findShopFixtureById(productFixture.shopId);
  const shop = shopFixture ? buildShopSnapshot(shopFixture) : null;
  return { product, shop, warnings: [] };
}
