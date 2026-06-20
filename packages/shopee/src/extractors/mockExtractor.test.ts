import { describe, expect, it } from "vitest";
import { mockExtractByUrl, mockExtractProduct, mockExtractShop } from "./mockExtractor.js";

describe("mockExtractProduct", () => {
  it("extracts product by itemId", async () => {
    const product = await mockExtractProduct({ shopId: "shop-001", itemId: "item-001" });
    expect(product.shopeeItemId).toBe("item-001");
    expect(product.title).toContain("Tensimeter");
    expect(product.shippedFrom).toBe("DKI Jakarta");
  });

  it("throws for missing product", async () => {
    await expect(mockExtractProduct({ shopId: "shop-001", itemId: "missing" })).rejects.toThrow();
  });
});

describe("mockExtractShop", () => {
  it("extracts shop by shopId", async () => {
    const shop = await mockExtractShop({ shopId: "shop-001" });
    expect(shop.name).toContain("Omron");
  });

  it("extracts shop by shopeeShopId", async () => {
    const shop = await mockExtractShop({ shopId: "shopee-shop-002" });
    expect(shop.shopeeShopId).toBe("shopee-shop-002");
  });

  it("throws for missing shop", async () => {
    await expect(mockExtractShop({ shopId: "missing" })).rejects.toThrow();
  });
});

describe("mockExtractByUrl", () => {
  it("returns product and shop for valid URL", async () => {
    const result = await mockExtractByUrl("https://shopee.co.id/product-1");
    expect(result.product).not.toBeNull();
    expect(result.shop).not.toBeNull();
    expect(result.warnings).toHaveLength(0);
  });

  it("returns nulls for unknown URL", async () => {
    const result = await mockExtractByUrl("https://example.com/unknown");
    expect(result.product).toBeNull();
    expect(result.shop).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns product and shop for product-2 URL", async () => {
    const result = await mockExtractByUrl("https://shopee.co.id/product-2");
    expect(result.product).not.toBeNull();
    expect(result.shop).not.toBeNull();
  });
});
