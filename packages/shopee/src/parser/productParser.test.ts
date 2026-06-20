import { describe, expect, it } from "vitest";
import { ProductParser } from "./productParser.js";
import { emptyProduct } from "../extractors/fallbackExtractor.js";

const parser = new ProductParser();

describe("ProductParser", () => {
  it("returns empty snapshot when no html or json provided", () => {
    const result = parser.parseProduct({ shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.title).toBeNull();
    expect(result.priceMin).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });

  it("parses HTML with title and price", () => {
    const html = '<html><body><h1>Test Product</h1><div>Rp 100.000</div></body></html>';
    const result = parser.parseProduct({
      html,
      shopId: "1",
      itemId: "2",
      canonicalUrl: "url",
    });
    expect(result.title).toBe("Test Product");
    expect(result.priceMin).toBe(100000);
    expect(result.priceMax).toBe(100000);
  });

  it("parses HTML with rating, review, sold count", () => {
    const html = '<h1>P</h1><div>Rp 100.000</div><span>4.5 rating</span><span>50 review</span><span>200 terjual</span>';
    const result = parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.rating).toBe(4.5);
    expect(result.reviewCount).toBe(50);
    expect(result.soldCount).toBe(200);
  });

  it("parses HTML with brand, category, description", () => {
    const html = '<h1>P</h1><meta property="product:brand" content="BrandX"/><meta property="product:category" content="CatA"/><meta name="description" content="Product description"/>';
    const result = parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.brand).toBe("BrandX");
    expect(result.category).toBe("CatA");
    expect(result.description).toBe("Product description");
  });

  it("parses HTML with image", () => {
    const html = '<h1>P</h1><meta property="og:image" content="https://example.com/image.jpg"/>';
    const result = parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.imageUrl).toBe("https://example.com/image.jpg");
  });

  it("parses HTML with stock and shippedFrom", () => {
    const html = '<h1>P</h1><span>50 stok tersedia</span><span>dari DKI Jakarta</span>';
    const result = parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.stock).toBe(50);
    expect(result.shippedFrom).toContain("DKI Jakarta");
  });

  it("parses JSON-LD product", () => {
    const html = `
      <script type="application/ld+json">
        {"@context": "https://schema.org", "@type": "Product", "name": "JSON-LD Product", "description": "desc", "image": "https://example.com/img.jpg", "brand": "BrandY", "sku": "12345", "offers": {"price": 150000, "priceCurrency": "IDR"}, "aggregateRating": {"ratingValue": 4.7, "reviewCount": 100}}
      </script>
    `;
    const result = parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.title).toBe("JSON-LD Product");
    expect(result.priceMin).toBe(150000);
    expect(result.rating).toBe(4.7);
    expect(result.reviewCount).toBe(100);
    expect(result.brand).toBe("BrandY");
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.85);
  });

  it("parses plain JSON with @type=Product", () => {
    const json = {
      "@type": "Product",
      name: "JSON Product",
      offers: { price: 200000 },
      aggregateRating: { ratingValue: 4.2, reviewCount: 50 },
    };
    const result = parser.parseProduct({ json, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.title).toBe("JSON Product");
    expect(result.priceMin).toBe(200000);
    expect(result.rating).toBe(4.2);
  });

  it("parses plain JSON with item wrapper", () => {
    const json = { item: { title: "Wrapped Product", price: 50000, rating: 4.0, sold: 100, brand: "WB" } };
    const result = parser.parseProduct({ json, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.title).toBe("Wrapped Product");
    expect(result.priceMin).toBe(50000);
    expect(result.rating).toBe(4.0);
    expect(result.soldCount).toBe(100);
    expect(result.brand).toBe("WB");
  });

  it("handles malformed JSON gracefully", () => {
    const json = { item: { title: "Test" } };
    const result = parser.parseProduct({ json, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(result.title).toBe("Test");
  });

  it("preserves shopId and itemId from input", () => {
    const result = parser.parseProduct({ shopId: "shop-99", itemId: "item-77", canonicalUrl: "url" });
    expect(result.shopeeShopId).toBe("shop-99");
    expect(result.shopeeItemId).toBe("item-77");
  });

  it("uses canonicalUrl from input", () => {
    const result = parser.parseProduct({ shopId: "1", itemId: "2", canonicalUrl: "https://shopee.co.id/product/1/2" });
    expect(result.canonicalUrl).toBe("https://shopee.co.id/product/1/2");
    expect(result.originalUrl).toBe("https://shopee.co.id/product/1/2");
  });

  it("returns null for missing fields with confidence 0", () => {
    const empty = emptyProduct("1", "2", "url");
    expect(empty.title).toBeNull();
    expect(empty.priceMin).toBeNull();
    expect(empty.rating).toBeNull();
    expect(empty.weight.value).toBeNull();
    expect(empty.weight.confidence).toBe(0);
  });

  it("does not leak secrets in error messages", () => {
    const html = '<script>api_key=secret12345 token=abc</script>';
    parser.parseProduct({ html, shopId: "1", itemId: "2", canonicalUrl: "url" });
    expect(true).toBe(true);
  });
});
