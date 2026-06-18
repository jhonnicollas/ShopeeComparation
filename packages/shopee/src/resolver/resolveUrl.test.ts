import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DirectResolveAdapter,
  HttpRedirectResolveAdapter,
  WebFetchResolveAdapter,
  BrowserRunResolveAdapter,
  resolveUrlWithFallback,
} from "./resolveUrl.js";

const originalFetch = globalThis.fetch;

describe("DirectResolveAdapter", () => {
  it("resolves full Shopee URL", async () => {
    const adapter = new DirectResolveAdapter();
    const result = await adapter.resolve({
      url: "https://shopee.co.id/Test-i.123.456",
    });
    expect(result.status).toBe("resolved");
    expect(result.itemId).toBe("456");
    expect(result.shopId).toBe("123");
  });

  it("fails on short URL", async () => {
    const adapter = new DirectResolveAdapter();
    const result = await adapter.resolve({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("failed");
  });

  it("fails on invalid URL", async () => {
    const adapter = new DirectResolveAdapter();
    const result = await adapter.resolve({ url: "not-a-url" });
    expect(result.status).toBe("failed");
  });
});

describe("HttpRedirectResolveAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("follows redirects", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "location": "https://shopee.co.id/product/123/456" },
      })
    );
    const adapter = new HttpRedirectResolveAdapter();
    const result = await adapter.resolve({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("resolved");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const adapter = new HttpRedirectResolveAdapter();
    const result = await adapter.resolve({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("Network error");
  });
});

describe("WebFetchResolveAdapter", () => {
  it("returns failed with not implemented message", async () => {
    const adapter = new WebFetchResolveAdapter();
    const result = await adapter.resolve({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("failed");
    expect(result.resolveMethod).toBe("webFetch");
    expect(result.errorMessage).toContain("TASK-090");
  });
});

describe("BrowserRunResolveAdapter", () => {
  it("returns failed with not implemented message", async () => {
    const adapter = new BrowserRunResolveAdapter();
    const result = await adapter.resolve({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("failed");
    expect(result.resolveMethod).toBe("browserRun");
    expect(result.errorMessage).toContain("TASK-091");
  });
});

describe("resolveUrlWithFallback", () => {
  it("uses first successful adapter", async () => {
    const result = await resolveUrlWithFallback({
      url: "https://shopee.co.id/Test-i.123.456",
    });
    expect(result.status).toBe("resolved");
    expect(result.adapterUsed).toBe("direct");
  });

  it("falls back to second adapter", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "location": "https://shopee.co.id/Test-i.123.456" },
      })
    );
    const result = await resolveUrlWithFallback({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("resolved");
    expect(result.adapterUsed).toBe("redirect");
  });

  it("returns failed when all adapters fail", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("boom"));
    const result = await resolveUrlWithFallback(
      { url: "https://id.shp.ee/abc" },
      [
        {
          name: "fake",
          resolve: async () => ({
            originalUrl: "https://id.shp.ee/abc",
            finalUrl: null,
            canonicalUrl: null,
            shopId: null,
            itemId: null,
            resolveMethod: "manual",
            status: "failed",
            errorMessage: "fake failed",
          }),
        },
      ]
    );
    expect(result.status).toBe("failed");
  });

  it("includes webFetch and browserRun in default fallback chain", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("boom"));
    const result = await resolveUrlWithFallback({ url: "https://id.shp.ee/abc" });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("webFetch");
    expect(result.errorMessage).toContain("browserRun");
    expect(result.errorMessage).toContain("TASK-090");
    expect(result.errorMessage).toContain("TASK-091");
  });
});
