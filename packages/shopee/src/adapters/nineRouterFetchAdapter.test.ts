import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NineRouterFetchAdapter,
  type NineRouterFetchConfig,
  loadSearchProviderConfig,
} from "./nineRouterFetchAdapter.js";

function createConfig(overrides: Partial<NineRouterFetchConfig> = {}): NineRouterFetchConfig {
  return {
    baseUrl: "https://test.example.com",
    apiKey: "test-key",
    modelName: "tp",
    timeoutMs: 5000,
    retryCount: 1,
    providerKey: "test-provider",
    ...overrides,
  };
}

function createMockResponse(body: unknown, status = 200) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => text,
  } as unknown as Response;
}

describe("NineRouterFetchAdapter", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveUrl", () => {
    it("resolves URL with itemId from response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: 'Shopee page shopee.co.id/product/123/456 <h1>Test</h1>',
                      }),
                    },
                  },
                ],
              },
            },
          ],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("resolved");
      expect(result.itemId).toBe("456");
      expect(result.shopId).toBe("123");
      expect(result.resolveMethod).toBe("webFetch");
    });

    it("returns failed when response has no itemId", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [
            {
              message: {
                tool_calls: [{ function: { arguments: JSON.stringify({ content: "no product here" }) } }],
              },
            },
          ],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.itemId).toBeNull();
    });

    it("returns failed when HTTP error", async () => {
      mockFetch.mockResolvedValue(createMockResponse("error", 500));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("HTTP 500");
    });

    it("returns failed when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network down"));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("Network down");
    });

    it("returns failed when no content in response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: "" } }],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("empty");
    });
  });

  describe("extractProduct", () => {
    it("parses product data from response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content:
                          '<h1>Test Product</h1><div>Rp 100.000</div><span>4.5 rating</span><span>50 terjual</span>',
                      }),
                    },
                  },
                ],
              },
            },
          ],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "123", itemId: "456" });
      expect(product.title).toBe("Test Product");
      expect(product.priceMin).toBe(100000);
      expect(product.rating).toBe(4.5);
      expect(product.soldCount).toBe(50);
      expect(product.shopeeItemId).toBe("456");
      expect(product.shopeeShopId).toBe("123");
      expect(product.confidenceScore).toBeGreaterThan(0);
    });

    it("returns empty snapshot when no data available", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: "" } }],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const product = await adapter.extractProduct({ shopId: "123", itemId: "456" });
      expect(product.title).toBeNull();
      expect(product.priceMin).toBeNull();
      expect(product.rating).toBeNull();
      expect(product.confidenceScore).toBe(0);
    });
  });

  describe("extractShop", () => {
    it("parses shop data from response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: '<h1>Test Shop</h1><span>4.8 rating</span><span>10000 follower</span><span>Shopee Mall</span>',
                      }),
                    },
                  },
                ],
              },
            },
          ],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.name).toBe("Test Shop");
      expect(shop.rating).toBe(4.8);
      expect(shop.followerCount).toBe(10000);
      expect(shop.primaryStatus).toBe("MALL");
    });

    it("returns empty shop snapshot when fetch fails", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: "" } }],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const shop = await adapter.extractShop({ shopId: "123" });
      expect(shop.name).toBeNull();
      expect(shop.primaryStatus).toBe("UNKNOWN");
    });
  });

  describe("searchProducts", () => {
    it("parses search results from response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: 'https://shopee.co.id/product/123/456 https://shopee.co.id/product/789/012',
                      }),
                    },
                  },
                ],
              },
            },
          ],
        })
      );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "test",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.source).toBe("nineRouterFetch");
    });

    it("returns empty when no results", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: "no results" } }],
        })
      );
      const adapter = new NineRouterFetchAdapter({
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

    it("handles SSE-style response with data: prefix and [DONE] suffix", async () => {
      const body =
        'data: {"choices":[{"message":{"tool_calls":[{"function":{"arguments":"{\\"content\\":\\"https://shopee.co.id/product/111/222\\"}"}}]}}]}\n\ndata: [DONE]';
      mockFetch.mockResolvedValue(createMockResponse(body));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.itemId).toBe("222");
      expect(candidates[0]?.shopId).toBe("111");
    });

    it("tolerates trailing characters after JSON (production bug)", async () => {
      const body =
        '{"choices":[{"message":{"tool_calls":[{"function":{"arguments":"{\\"content\\":\\"https://shopee.co.id/product/333/444\\"}"}}]}}]}\nextra trailing';
      mockFetch.mockResolvedValue(createMockResponse(body));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.itemId).toBe("444");
    });

    it("tolerates malformed tool_call arguments JSON", async () => {
      const body = JSON.stringify({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: '{"content":"https://shopee.co.id/product/555/666",}',
                  },
                },
              ],
            },
          },
        ],
      });
      mockFetch.mockResolvedValue(createMockResponse(body));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.itemId).toBe("666");
    });

    it("executes web_fetch tool call agentically when model returns tool_calls with url", async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            choices: [
              {
                message: {
                  role: "assistant",
                  tool_calls: [
                    {
                      id: "call_1",
                      function: {
                        name: "web_fetch",
                        arguments: JSON.stringify({ url: "https://shopee.co.id/search?keyword=tester" }),
                      },
                    },
                  ],
                },
              },
            ],
          })
        )
        .mockResolvedValueOnce(
          createMockResponse(
            '<html><a href="https://shopee.co.id/product/777/888">Product</a></html>'
          )
        )
        .mockResolvedValueOnce(
          createMockResponse({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Found product at https://shopee.co.id/product/777/888",
                },
              },
            ],
          })
        );
      const adapter = new NineRouterFetchAdapter({
        config: createConfig(),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const candidates = await adapter.searchProducts({
        keyword: "tester",
        shippedFrom: "DKI Jakarta",
        limit: 10,
      });
      expect(candidates.length).toBeGreaterThanOrEqual(1);
      expect(candidates[0]?.itemId).toBe("888");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("error safety", () => {
    it("does not leak API key in error messages", async () => {
      mockFetch.mockRejectedValue(new Error("api_key=secret12345 token=abc"));
      const adapter = new NineRouterFetchAdapter({
        config: createConfig({ apiKey: "secret-12345" }),
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      const result = await adapter.resolveUrl({ url: "https://id.shp.ee/abc" });
      expect(result.errorMessage).not.toContain("secret12345");
    });
  });
});

describe("loadSearchProviderConfig", () => {
  it("returns config when provider is enabled", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "srp_1",
          providerKey: "9router",
          displayName: "9router",
          providerType: "webFetch",
          priority: 100,
          baseUrl: "https://test-config.example.com",
          authType: "bearer",
          secretRef: "NINEROUTER_API_KEY",
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
    const env = { NINEROUTER_API_KEY: "test-key" };
    const config = await loadSearchProviderConfig(
      mockDb as unknown as D1Database,
      "9router",
      env
    );
    expect(config).not.toBeNull();
    expect(config?.apiKey).toBe("test-key");
    expect(config?.baseUrl).toBe("https://test-config.example.com");
  });

  it("returns null when provider is disabled", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }),
    };
    const config = await loadSearchProviderConfig(
      mockDb as unknown as D1Database,
      "9router",
      {}
    );
    expect(config).toBeNull();
  });
});
