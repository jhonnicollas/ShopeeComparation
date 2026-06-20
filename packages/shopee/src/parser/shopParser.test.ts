import { describe, expect, it } from "vitest";
import { ShopParser } from "./shopParser.js";
import { emptyShop } from "../extractors/fallbackExtractor.js";

const parser = new ShopParser();

describe("ShopParser", () => {
  it("returns empty snapshot when no html or json provided", () => {
    const result = parser.parseShop({ shopId: "1" });
    expect(result.name).toBeNull();
    expect(result.primaryStatus).toBe("UNKNOWN");
    expect(result.confidenceScore).toBe(0);
  });

  it("parses HTML with name and rating", () => {
    const html = '<html><body><h1>Test Shop</h1><span>4.5 rating</span></body></html>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.name).toBe("Test Shop");
    expect(result.rating).toBe(4.5);
  });

  it("parses HTML with response rate and time", () => {
    const html = '<h1>Shop</h1><span>95% response rate</span><span>response time: 2 hours</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.responseRate).toBe(95);
    expect(result.responseTime).toBe("2 hours");
  });

  it("parses HTML with follower count and product count", () => {
    const html = '<h1>Shop</h1><span>10000 follower</span><span>500 produk</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.followerCount).toBe(10000);
    expect(result.productCount).toBe(500);
  });

  it("parses HTML with joinedAge and location", () => {
    const html = '<h1>Shop</h1><span>joined: 5 tahun lalu</span><span>location: Jakarta</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.joinedAgeText).toBe("5 tahun lalu");
    expect(result.location).toBe("Jakarta");
  });

  it("detects Shopee Mall status", () => {
    const html = '<h1>Mall</h1><span>Shopee Mall</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("MALL");
    expect(result.statusLabels).toContain("Shopee Mall");
  });

  it("detects Star+ status", () => {
    const html = '<h1>Shop</h1><span>Star+ Seller</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("STARPLUS");
  });

  it("detects Star Seller status", () => {
    const html = '<h1>Shop</h1><span>Star Seller</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("STAR");
  });

  it("detects Official Store status", () => {
    const html = '<h1>Shop</h1><span>Official Store</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("OFFICIAL");
  });

  it("detects Preferred Seller status", () => {
    const html = '<h1>Shop</h1><span>Preferred Seller</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("PREFERRED");
  });

  it("parses JSON-LD Store", () => {
    const html = `
      <script type="application/ld+json">
        {"@type": "Store", "name": "JSON-LD Store", "description": "Shop description", "aggregateRating": {"ratingValue": 4.8, "reviewCount": 200}}
      </script>
    `;
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.name).toBe("JSON-LD Store");
    expect(result.rating).toBe(4.8);
    expect(result.ratingCount).toBe(200);
  });

  it("parses plain JSON with shop wrapper", () => {
    const json = {
      shop: {
        name: "JSON Shop",
        rating: 4.5,
        follower: 5000,
        responseRate: 90,
        responseTime: "1 hour",
        productCount: 100,
        joinedAgeText: "3 years",
        location: "Bandung",
        status: "Star+",
      },
    };
    const result = parser.parseShop({ json, shopId: "1" });
    expect(result.name).toBe("JSON Shop");
    expect(result.rating).toBe(4.5);
    expect(result.followerCount).toBe(5000);
    expect(result.responseRate).toBe(90);
    expect(result.responseTime).toBe("1 hour");
    expect(result.productCount).toBe(100);
    expect(result.joinedAgeText).toBe("3 years");
    expect(result.location).toBe("Bandung");
    expect(result.primaryStatus).toBe("STARPLUS");
  });

  it("preserves shopId from input", () => {
    const result = parser.parseShop({ shopId: "shop-99" });
    expect(result.shopeeShopId).toBe("shop-99");
    expect(result.shopUrl).toBe("https://shopee.co.id/shop/shop-99");
  });

  it("returns null for missing fields with confidence 0", () => {
    const empty = emptyShop("1");
    expect(empty.name).toBeNull();
    expect(empty.rating).toBeNull();
    expect(empty.followerCount).toBeNull();
    expect(empty.primaryStatus).toBe("UNKNOWN");
    expect(empty.confidenceScore).toBe(0);
  });

  it("handles malformed JSON gracefully", () => {
    const result = parser.parseShop({ json: { random: "data" }, shopId: "1" });
    expect(result.name).toBeNull();
  });

  it("handles mixed case status detection", () => {
    const html = '<h1>Shop</h1><span>shopee MALL</span>';
    const result = parser.parseShop({ html, shopId: "1" });
    expect(result.primaryStatus).toBe("MALL");
  });
});
