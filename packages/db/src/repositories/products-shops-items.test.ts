import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  upsertProduct,
  findProductById,
  findProductByShopeeItemId,
  snapshotToUpsertProduct,
} from "./products.js";
import {
  upsertShop,
  findShopById,
  findShopByShopeeId,
  snapshotToUpsertShop,
} from "./shops.js";
import {
  saveProductWeight,
  saveProductFeatures,
  createComparisonItem,
  findComparisonItemById,
  listComparisonItemsByComparison,
} from "./comparisonItems.js";

interface MockStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

class MockD1 {
  public tables: Record<string, Array<Record<string, unknown>>> = {
    sh_products: [],
    sh_shops: [],
    sh_productWeights: [],
    sh_productFeatures: [],
    sh_comparisonItems: [],
  };

  prepare(query: string) {
    const stmt: MockStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };

    const tableName = Object.keys(this.tables).find((t) => query.includes(t));
    if (!tableName) return stmt;

    if (query.includes("WHERE id = ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.tables[tableName]!.find((r) => r.id === args[0]) ?? null;
      });
    } else if (query.includes("WHERE shopeeItemId = ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.tables[tableName]!.find((r) => r.shopeeItemId === args[0]) ?? null;
      });
    } else if (query.includes("WHERE shopeeShopId = ?")) {
      stmt.first.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        return this.tables[tableName]!.find((r) => r.shopeeShopId === args[0]) ?? null;
      });
    } else if (query.includes("ORDER BY rank")) {
      stmt.all.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const rows = this.tables[tableName]!
          .filter((r) => r.comparisonId === args[0])
          .sort((a, b) => Number(a.rank) - Number(b.rank));
        return { results: rows };
      });
    } else if (query.includes("INSERT INTO")) {
      stmt.run.mockImplementation(async () => {
        const args = stmt.bind.mock.calls[0] || [];
        const cols = this.extractColumns(query);
        const row: Record<string, unknown> = {};
        cols.forEach((c, i) => {
          row[c] = args[i];
        });
        this.tables[tableName]!.push(row);
        return { success: true };
      });
    }
    return stmt;
  }

  private extractColumns(query: string): string[] {
    const match = query.match(/\(([^)]+)\)\s*VALUES/i);
    if (!match) return [];
    return match[1]!
      .split(",")
      .map((c) => c.trim().split(/\s+/)[0]!.replace(/"/g, ""));
  }
}

describe("products repository", () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
  });

  it("upserts product", async () => {
    const input = snapshotToUpsertProduct("prd_1", "item-1", "shop-1", {
      shopeeItemId: "item-1",
      shopeeShopId: "shop-1",
      title: "Test",
      brand: "Brand",
      category: "Cat",
      originalUrl: "https://shopee.co.id/p1",
      canonicalUrl: "https://shopee.co.id/p1",
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin: 100000,
      priceMax: 150000,
      priceBeforeDiscount: null,
      discountText: null,
      rating: 4.5,
      reviewCount: 100,
      soldCount: 200,
      favoriteCount: 50,
      stock: 10,
      shippedFrom: "DKI Jakarta",
      description: null,
      specificationJson: null,
      variationJson: null,
      weight: { value: 500, unit: "gram", rawText: "500g", source: "mock", confidence: 1 },
      features: [],
      confidenceScore: 1,
    });
    const product = await upsertProduct(db as unknown as D1Database, input);
    expect(product.id).toBe("prd_1");
    const found = await findProductById(db as unknown as D1Database, "prd_1");
    expect(found?.title).toBe("Test");
  });

  it("finds by shopeeItemId", async () => {
    const input = snapshotToUpsertProduct("prd_1", "item-1", "shop-1", {
      shopeeItemId: "item-1",
      shopeeShopId: "shop-1",
      title: "T",
      brand: null,
      category: null,
      originalUrl: null,
      canonicalUrl: null,
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin: null,
      priceMax: null,
      priceBeforeDiscount: null,
      discountText: null,
      rating: null,
      reviewCount: null,
      soldCount: null,
      favoriteCount: null,
      stock: null,
      shippedFrom: null,
      description: null,
      specificationJson: null,
      variationJson: null,
      weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
      features: [],
      confidenceScore: 0,
    });
    await upsertProduct(db as unknown as D1Database, input);
    const found = await findProductByShopeeItemId(db as unknown as D1Database, "item-1");
    expect(found?.id).toBe("prd_1");
  });
});

describe("shops repository", () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
  });

  it("upserts shop", async () => {
    const input = snapshotToUpsertShop("shp_1", {
      shopeeShopId: "shopee-shop-1",
      name: "Test Shop",
      shopUrl: "https://shopee.co.id/shop-1",
      statusLabels: ["Mall"],
      primaryStatus: "MALL",
      rating: 4.8,
      ratingCount: 1000,
      responseRate: 95,
      responseTime: "1 jam",
      followerCount: 5000,
      productCount: 100,
      joinedAgeText: "3 tahun",
      location: "Jakarta",
      confidenceScore: 1,
    });
    const shop = await upsertShop(db as unknown as D1Database, input);
    expect(shop.id).toBe("shp_1");
    const found = await findShopByShopeeId(db as unknown as D1Database, "shopee-shop-1");
    expect(found?.name).toBe("Test Shop");
  });

  it("finds by id", async () => {
    const input = snapshotToUpsertShop("shp_1", {
      shopeeShopId: "shopee-shop-1",
      name: "X",
      shopUrl: null,
      statusLabels: [],
      primaryStatus: null,
      rating: null,
      ratingCount: null,
      responseRate: null,
      responseTime: null,
      followerCount: null,
      productCount: null,
      joinedAgeText: null,
      location: null,
      confidenceScore: 0,
    });
    await upsertShop(db as unknown as D1Database, input);
    const found = await findShopById(db as unknown as D1Database, "shp_1");
    expect(found?.shopeeShopId).toBe("shopee-shop-1");
  });
});

describe("comparison items repository", () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
  });

  it("saves weight", async () => {
    await saveProductWeight(db as unknown as D1Database, {
      id: "wgt_1",
      productId: "prd_1",
      weight: { value: 500, unit: "gram", rawText: "500g", source: "mock", confidence: 1 },
    });
    expect(db.tables.sh_productWeights).toHaveLength(1);
  });

  it("saves multiple features", async () => {
    await saveProductFeatures(db as unknown as D1Database, {
      productId: "prd_1",
      features: [
        { name: "Akurasi", value: "±3", source: "mock", confidence: 1 },
        { name: "Memory", value: "60", source: "mock", confidence: 1 },
      ],
    });
    expect(db.tables.sh_productFeatures).toHaveLength(2);
  });

  it("creates comparison item", async () => {
    const item = await createComparisonItem(db as unknown as D1Database, {
      id: "cim_1",
      comparisonId: "cmp_1",
      productId: "prd_1",
      shopId: "shp_1",
      rank: 1,
      finalScore: 0.85,
      ratingScore: 0.9,
      reviewCountScore: 0.8,
      soldCountScore: 0.85,
      priceScore: 0.7,
      shopTrustScore: 0.95,
      responseRateScore: 0.9,
      featureMatchScore: 0.8,
      riskPenalty: 0,
      prosJson: ["High rating"],
      consJson: ["Higher price"],
      riskJson: [],
    });
    expect(item.rank).toBe(1);
    const items = await listComparisonItemsByComparison(
      db as unknown as D1Database,
      "cmp_1"
    );
    expect(items).toHaveLength(1);
  });

  it("lists items ordered by rank", async () => {
    await createComparisonItem(db as unknown as D1Database, {
      id: "cim_1",
      comparisonId: "cmp_1",
      productId: "prd_1",
      shopId: null,
      rank: 2,
      finalScore: 0.7,
      ratingScore: 0.7,
      reviewCountScore: 0.7,
      soldCountScore: 0.7,
      priceScore: 0.7,
      shopTrustScore: 0.7,
      responseRateScore: 0.7,
      featureMatchScore: 0.7,
      riskPenalty: 0,
      prosJson: null,
      consJson: null,
      riskJson: null,
    });
    await createComparisonItem(db as unknown as D1Database, {
      id: "cim_2",
      comparisonId: "cmp_1",
      productId: "prd_2",
      shopId: null,
      rank: 1,
      finalScore: 0.9,
      ratingScore: 0.9,
      reviewCountScore: 0.9,
      soldCountScore: 0.9,
      priceScore: 0.9,
      shopTrustScore: 0.9,
      responseRateScore: 0.9,
      featureMatchScore: 0.9,
      riskPenalty: 0,
      prosJson: null,
      consJson: null,
      riskJson: null,
    });
    const items = await listComparisonItemsByComparison(
      db as unknown as D1Database,
      "cmp_1"
    );
    expect(items[0]?.id).toBe("cim_2");
    expect(items[1]?.id).toBe("cim_1");
  });

  it("finds comparison item by id", async () => {
    await createComparisonItem(db as unknown as D1Database, {
      id: "cim_1",
      comparisonId: "cmp_1",
      productId: "prd_1",
      shopId: null,
      rank: 1,
      finalScore: 0.8,
      ratingScore: 0.8,
      reviewCountScore: 0.8,
      soldCountScore: 0.8,
      priceScore: 0.8,
      shopTrustScore: 0.8,
      responseRateScore: 0.8,
      featureMatchScore: 0.8,
      riskPenalty: 0,
      prosJson: null,
      consJson: null,
      riskJson: null,
    });
    const found = await findComparisonItemById(db as unknown as D1Database, "cim_1");
    expect(found?.rank).toBe(1);
  });
});
