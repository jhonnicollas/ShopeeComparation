import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrowserRunAdapter,
  type BrowserRunConfig,
  loadBrowserRunConfig,
} from "./browserRunAdapter.js";

function createConfig(overrides: Partial<BrowserRunConfig> = {}): BrowserRunConfig {
  return {
    baseUrl: "https://br.test.example.com",
    apiKey: "test-key",
    timeoutMs: 5000,
    providerKey: "br-test",
    ...overrides,
  };
}

function createMockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("BrowserRunAdapter", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveUrl", () => {
    it("resolves URL with itemId from rendered HTML", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: 'Shopee page shopee.co.id/product/123/456 <h1>Test</h1>',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("resolved");
      expect(result.itemId).toBe("456");
      expect(result.shopId).toBe("123");
      expect(result.resolveMethod).toBe("browserRun");
    });

    it("returns failed when HTML has no itemId", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ html: "empty page" })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.itemId).toBeNull();
    });

    it("returns failed on HTTP error", async () => {
      mockFetch.mockResolvedValue(createMockResponse("error", 500));
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("HTTP 500");
    });

    it("returns failed when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network down"));
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("Network down");
    });

    it("uses canonical URL from link tag", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: 'shopee.co.id/product/123/456 <link rel="canonical" href="https://shopee.co.id/product/123/456-final"/>',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.canonicalUrl).toBe("https://shopee.co.id/product/123/456-final");
    });
  });

  describe("extractProduct", () => {
    it("parses product data from rendered HTML", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: '<h1>Test Product</h1><div>Rp 200.000</div><span>4.7 rating</span><span>100 terjual</span>',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "123", itemId: "456" });
      expect(product.title).toBe("Test Product");
      expect(product.priceMin).toBe(200000);
      expect(product.rating).toBe(4.7);
      expect(product.soldCount).toBe(100);
      expect(product.confidenceScore).toBeGreaterThan(0.5);
    });

    it("returns empty snapshot when no HTML", async () => {
      mockFetch.mockResolvedValue(createMockResponse({}));
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "123", itemId: "456" });
      expect(product.title).toBeNull();
      expect(product.confidenceScore).toBe(0);
    });
  });

  describe("extractShop", () => {
    it("parses shop data from rendered HTML", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: '<h1>Test Shop</h1><span>4.9 rating</span><span>5000 follower</span><span>Star+</span>',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.name).toBe("Test Shop");
      expect(shop.rating).toBe(4.9);
      expect(shop.followerCount).toBe(5000);
      expect(shop.primaryStatus).toBe("STARPLUS");
    });

    it("detects Shopee Mall", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: '<h1>Mall Shop</h1><span>Shopee Mall</span>',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.primaryStatus).toBe("MALL");
    });

    it("returns empty shop snapshot on fetch failure", async () => {
      mockFetch.mockResolvedValue(createMockResponse({}));
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.primaryStatus).toBe("UNKNOWN");
      expect(shop.confidenceScore).toBe(0);
    });
  });

  describe("searchProducts", () => {
    it("parses search results", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          html: 'https://shopee.co.id/product/123/456 https://shopee.co.id/product/789/012',
        })
      );
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "test",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.source).toBe("browserRun");
    });

    it("returns empty on no results", async () => {
      mockFetch.mockResolvedValue(createMockResponse({ html: "no results" }));
      const adapter = new BrowserRunAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "empty",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates).toHaveLength(0);
    });
  });

  describe("error safety", () => {
    it("does not leak secrets in error messages", async () => {
      mockFetch.mockRejectedValue(new Error("api_key=secret12345 token=abc"));
      const adapter = new BrowserRunAdapter({
        config: createConfig({ apiKey: "real-key" }),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.errorMessage).not.toContain("secret12345");
    });
  });
});

describe("loadBrowserRunConfig", () => {
  it("returns config when provider is browserRun and enabled", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "srp_br",
          providerKey: "browserRun1",
          displayName: "Browser Run",
          providerType: "browserRun",
          priority: 200,
          baseUrl: "https://br.test.com",
          authType: "bearer",
          secretRef: "BR_KEY",
          timeoutMs: 30000,
          retryCount: 1,
          isEnabled: 1,
          lastTestStatus: null,
          lastTestAt: null,
          lastTestMessage: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        }),
      }),
    };
    const env = { BR_KEY: "test-key" };
    const config = await loadBrowserRunConfig(
      mockDb as unknown as D1Database,
      "browserRun1",
      env
    );
    expect(config).not.toBeNull();
    expect(config?.apiKey).toBe("test-key");
    expect(config?.baseUrl).toBe("https://br.test.com");
  });

  it("returns null when provider type is not browserRun", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "srp_1",
          providerKey: "webFetch1",
          displayName: "Web Fetch",
          providerType: "webFetch",
          priority: 100,
          baseUrl: "https://wf.test.com",
          authType: "bearer",
          secretRef: null,
          timeoutMs: 30000,
          retryCount: 1,
          isEnabled: 1,
          lastTestStatus: null,
          lastTestAt: null,
          lastTestMessage: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        }),
      }),
    };
    const config = await loadBrowserRunConfig(
      mockDb as unknown as D1Database,
      "webFetch1",
      {}
    );
    expect(config).toBeNull();
  });

  it("returns null when provider is disabled", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }),
    };
    const config = await loadBrowserRunConfig(
      mockDb as unknown as D1Database,
      "missing",
      {}
    );
    expect(config).toBeNull();
  });
});
