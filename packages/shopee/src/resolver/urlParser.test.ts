import { describe, expect, it } from "vitest";
import { parseShopeeUrl } from "./urlParser.js";

describe("parseShopeeUrl", () => {
  it("returns invalid for malformed URL", () => {
    const result = parseShopeeUrl({ url: "not-a-url" });
    expect(result.isValid).toBe(false);
  });

  it("detects Shopee host", () => {
    const result = parseShopeeUrl({ url: "https://shopee.co.id/product/123/456" });
    expect(result.isShopeeHost).toBe(true);
    expect(result.isShortUrl).toBe(false);
  });

  it("detects short URL host", () => {
    const result = parseShopeeUrl({ url: "https://id.shp.ee/abc" });
    expect(result.isShortUrl).toBe(true);
  });

  it("extracts shopId and itemId from path", () => {
    const result = parseShopeeUrl({
      url: "https://shopee.co.id/Converse-Run-Star-Sneaker-i.123.456",
    });
    expect(result.shopId).toBe("123");
    expect(result.itemId).toBe("456");
  });

  it("extracts itemId from query param", () => {
    const result = parseShopeeUrl({
      url: "https://shopee.co.id/product?item_id=789",
    });
    expect(result.itemId).toBe("789");
  });

  it("builds normalized URL", () => {
    const result = parseShopeeUrl({
      url: "https://shopee.co.id/Test-i.100.200",
    });
    expect(result.normalizedUrl).toBe("https://shopee.co.id/product/100/200");
  });

  it("extracts shopId from shop URL", () => {
    const result = parseShopeeUrl({ url: "https://shopee.co.id/shop/555" });
    expect(result.shopId).toBe("555");
  });

  it("returns shopee host false for non-shopee", () => {
    const result = parseShopeeUrl({ url: "https://tokopedia.com/product/123" });
    expect(result.isShopeeHost).toBe(false);
  });

  it("extracts itemId from plain numeric path", () => {
    const result = parseShopeeUrl({
      url: "https://shopee.co.id/i.123.456",
    });
    expect(result.shopId).toBe("123");
    expect(result.itemId).toBe("456");
  });
});
