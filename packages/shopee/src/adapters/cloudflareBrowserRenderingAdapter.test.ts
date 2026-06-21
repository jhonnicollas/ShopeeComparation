import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudflareBrowserRenderingAdapter } from "./cloudflareBrowserRenderingAdapter.js";

function createConfig() {
  return {
    accountId: "test-account",
    apiToken: "test-token",
    timeoutMs: 10000,
    providerKey: "test-cfbr",
  };
}

function makeSnapshotResponse(html: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      JSON.stringify({ success: true, result: { content: html, screenshot: "" } }),
  } as unknown as Response;
}

describe("CloudflareBrowserRenderingAdapter", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchProducts", () => {
    it("extracts product URLs from rendered HTML", async () => {
      const html = `
        <html><body>
          <a href="https://shopee.co.id/product/111/222">Product A</a>
          <a href="https://shopee.co.id/product/333/444">Product B</a>
        </body></html>
      `;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 5,
      });
      expect(candidates.length).toBe(2);
      expect(candidates[0]?.itemId).toBe("222");
      expect(candidates[0]?.source).toBe("cloudflareBrowserRendering");
    });

    it("returns empty array when rendered HTML has no products (no mock fallback)", async () => {
      const html = `<html><body><div>No products here, anti-bot</div></body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 3,
      });
      expect(candidates).toEqual([]);
    });

    it("returns empty array when Cloudflare API fails (no mock fallback)", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      await expect(
        adapter.searchProducts({
          keyword: "tester",
          shippedFrom: "DKI Jakarta",
          limit: 5,
        })
      ).rejects.toThrow("Network error");
    });

    it("deduplicates by shopId:itemId", async () => {
      const html = `
        <a href="https://shopee.co.id/product/111/222">A</a>
        <a href="https://shopee.co.id/product/111/222">A again</a>
        <a href="https://shopee.co.id/product/333/444">B</a>
      `;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBe(2);
    });

    it("respects input.limit", async () => {
      const html = `
        <a href="https://shopee.co.id/product/1/1">1</a>
        <a href="https://shopee.co.id/product/2/2">2</a>
        <a href="https://shopee.co.id/product/3/3">3</a>
        <a href="https://shopee.co.id/product/4/4">4</a>
      `;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 2,
      });
      expect(candidates.length).toBe(2);
    });
  });

  describe("extractProduct", () => {
    it("returns partial snapshot when rendering succeeds", async () => {
      const html = `<html><body><h1>Real Product Title</h1><div class="price">Rp 99.000</div></body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "123", itemId: "456" });
      expect(product.title).toBe("Real Product Title");
      expect(product.priceMin).toBe(99000);
    });

    it("returns snapshot with null fields when rendering returns empty page", async () => {
      const html = `<html><body>empty</body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "999", itemId: "888" });
      expect(product.title).toBeNull();
      expect(product.confidenceScore).toBe(0);
    });

    it("rethrows fetch errors (no silent mock fallback)", async () => {
      mockFetch.mockRejectedValue(new Error("Browser Render down"));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      await expect(adapter.extractProduct({ shopId: "1", itemId: "2" })).rejects.toThrow(
        "Browser Render down"
      );
    });
  });

  describe("extractShop", () => {
    it("extracts shop name from rendered page", async () => {
      const html = `<html><body><h1>Real Shop Name</h1></body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.name).toBe("Real Shop Name");
      expect(shop.confidenceScore).toBe(0.3);
    });

    it("returns null name when rendered page has no shop heading", async () => {
      const html = `<html><body>no shop here</body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "999" });
      expect(shop.name).toBeNull();
      expect(shop.confidenceScore).toBe(0);
    });
  });

  describe("resolveUrl", () => {
    it("extracts product ID from rendered short URL page", async () => {
      const html = `<html><body><a href="https://shopee.co.id/product/123/456">Target</a></body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("resolved");
      expect(result.itemId).toBe("456");
      expect(result.shopId).toBe("123");
    });

    it("returns failed when no product link in rendered page", async () => {
      const html = `<html><body>nothing here</body></html>`;
      mockFetch.mockResolvedValue(makeSnapshotResponse(html));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
    });

    it("returns failed when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network down"));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("Network down");
    });
  });

  describe("security", () => {
    it("does not leak API token in error messages", async () => {
      mockFetch.mockRejectedValue(new Error("auth: bearer abc-secret-token-12345"));
      const adapter = new CloudflareBrowserRenderingAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.errorMessage).not.toContain("abc-secret-token-12345");
      expect(result.errorMessage).toContain("[REDACTED]");
    });
  });
});
