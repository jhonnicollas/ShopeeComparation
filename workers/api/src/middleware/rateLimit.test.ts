import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, rateLimitMiddleware, getClientIp, getConfigForPath, DEFAULT_CONFIG, HEAVY_CONFIG, store } from "./rateLimit.js";

describe("rateLimit", () => {
  beforeEach(() => {
    store.clear();
  });

  it("allows requests within limit", () => {
    const req = new Request("http://localhost/api/health");
    const result = checkRateLimit(req);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(DEFAULT_CONFIG.maxRequests - 1);
  });

  it("blocks requests over limit", () => {
    const req = new Request("http://localhost/api/health");
    for (let i = 0; i < DEFAULT_CONFIG.maxRequests; i++) {
      checkRateLimit(req);
    }
    const result = checkRateLimit(req);
    expect(result.allowed).toBe(false);
  });

  it("uses heavy config for research endpoints", () => {
    const config = getConfigForPath("/api/research/compare-links");
    expect(config.maxRequests).toBe(HEAVY_CONFIG.maxRequests);
  });

  it("uses default config for health endpoint", () => {
    const config = getConfigForPath("/api/health");
    expect(config.maxRequests).toBe(DEFAULT_CONFIG.maxRequests);
  });

  it("extracts client IP from cf object", () => {
    const req = new Request("http://localhost/api/health");
    Object.defineProperty(req, "cf", { value: { connectingIp: "1.2.3.4" }, configurable: true });
    const ip = getClientIp(req);
    expect(ip).toBe("1.2.3.4");
  });

  it("extracts client IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost/api/health", {
      headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" },
    });
    const ip = getClientIp(req);
    expect(ip).toBe("5.6.7.8");
  });

  it("returns unknown when no IP headers", () => {
    const req = new Request("http://localhost/api/health");
    const ip = getClientIp(req);
    expect(ip).toBe("unknown");
  });

  it("returns 429 response when rate limited", () => {
    const req = new Request("http://localhost/api/health");
    for (let i = 0; i < DEFAULT_CONFIG.maxRequests; i++) {
      checkRateLimit(req);
    }
    const res = rateLimitMiddleware(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it("returns null when not rate limited", () => {
    const req = new Request("http://localhost/api/health");
    const res = rateLimitMiddleware(req);
    expect(res).toBeNull();
  });

  it("applies heavy limits to keyword-search", () => {
    const config = getConfigForPath("/api/research/keyword-search");
    expect(config.maxRequests).toBe(HEAVY_CONFIG.maxRequests);
  });
});
