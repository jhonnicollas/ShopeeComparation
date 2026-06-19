import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchProviderAdapter } from "./searchProviderAdapter.js";

class MockD1Database {
  public provider: Record<string, unknown> | null = null;
  public shouldThrow: boolean = false;

  prepare() {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockImplementation(async () => {
        if (this.shouldThrow) throw new Error("db error");
        return this.provider;
      }),
      run: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [] }),
    };
    return stmt;
  }
}

function makeProvider(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "srp_1",
    providerKey: "9router",
    displayName: "9router",
    providerType: "webFetch",
    priority: 100,
    baseUrl: "https://api.example.com",
    authType: "bearer",
    secretRef: "TEST_KEY",
    timeoutMs: 5000,
    retryCount: 1,
    isEnabled: 1,
    lastTestStatus: null,
    lastTestAt: null,
    lastTestMessage: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

describe("SearchProviderAdapter", () => {
  let db: MockD1Database;
  const env = { TEST_KEY: "test-secret" };

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("returns empty when provider is disabled", async () => {
    db.provider = makeProvider({ isEnabled: 0 });
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("returns empty when provider is not found", async () => {
    db.provider = null;
    const adapter = new SearchProviderAdapter({
      providerKey: "missing",
      db: db as unknown as D1Database,
      env,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("returns empty for manual providerType", async () => {
    db.provider = makeProvider({ providerType: "manual" });
    const adapter = new SearchProviderAdapter({
      providerKey: "manual1",
      db: db as unknown as D1Database,
      env,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("returns empty for officialApi providerType", async () => {
    db.provider = makeProvider({ providerType: "officialApi" });
    const adapter = new SearchProviderAdapter({
      providerKey: "official1",
      db: db as unknown as D1Database,
      env,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("uses 9router adapter for webFetch type with mocked fetch", async () => {
    db.provider = makeProvider({ providerType: "webFetch" });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: "https://shopee.co.id/product/123/456",
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    const result = await adapter.search({
      keyword: "tensimeter",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.itemId).toBe("456");
    expect(result[0]?.shopId).toBe("123");
    expect(result[0]?.shippedFrom).toBe("DKI Jakarta");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("uses Browser Run adapter for browserRun type with mocked fetch", async () => {
    db.provider = makeProvider({ providerType: "browserRun" });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ html: "https://shopee.co.id/product/789/012" }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const adapter = new SearchProviderAdapter({
      providerKey: "browserRun1",
      db: db as unknown as D1Database,
      env,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    const result = await adapter.search({
      keyword: "laptop",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.itemId).toBe("012");
    expect(result[0]?.shopId).toBe("789");
  });

  it("returns empty and does not throw when db errors", async () => {
    db.shouldThrow = true;
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("handles missing secret env gracefully", async () => {
    db.provider = makeProvider({ providerType: "webFetch" });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: "https://shopee.co.id/product/123/456",
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env: {},
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    const result = await adapter.search({
      keyword: "test",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("uses 9router adapter for providerType '9router' explicitly", async () => {
    db.provider = makeProvider({ providerKey: "9router", providerType: "9router" });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: "https://shopee.co.id/product/111/222",
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    const result = await adapter.search({
      keyword: "phone",
      shippedFrom: "DKI Jakarta",
      limit: 5,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("setDb resets cache", async () => {
    db.provider = makeProvider({ isEnabled: 0 });
    const adapter = new SearchProviderAdapter({
      providerKey: "9router",
      db: db as unknown as D1Database,
      env,
    });
    const r1 = await adapter.search({ keyword: "x", shippedFrom: "DKI Jakarta", limit: 10 });
    expect(r1).toEqual([]);
    db.provider = makeProvider({ providerType: "webFetch" });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        content: "https://shopee.co.id/product/1/2",
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    adapter.setDb(db as unknown as D1Database);
    (adapter as unknown as { fetchImpl: typeof fetch }).fetchImpl = mockFetch as unknown as typeof fetch;
    const r2 = await adapter.search({ keyword: "y", shippedFrom: "DKI Jakarta", limit: 5 });
    expect(r2.length).toBeGreaterThanOrEqual(1);
  });
});
