import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  getSessionExpiry,
  hashSessionToken,
  hashSessionTokenAsync,
  hashIp,
  hashUserAgent,
  isSessionExpired,
  isSessionRevoked,
} from "./session.js";

describe("generateSessionToken", () => {
  it("generates a non-empty token", () => {
    const token = generateSessionToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
  });

  it("generates unique tokens", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).not.toBe(token2);
  });

  it("generates URL-safe tokens", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("hashSessionToken", () => {
  it("returns non-empty hash", () => {
    const hash = hashSessionToken("test-token");
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });

  it("returns same hash for same token", () => {
    const hash1 = hashSessionToken("test-token");
    const hash2 = hashSessionToken("test-token");
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different token", () => {
    const hash1 = hashSessionToken("test-token");
    const hash2 = hashSessionToken("other-token");
    expect(hash1).not.toBe(hash2);
  });
});

describe("hashSessionTokenAsync", () => {
  it("returns SHA-256 hash", async () => {
    const hash = await hashSessionTokenAsync("test-token");
    expect(hash).toBeDefined();
    expect(hash.length).toBe(43);
  });

  it("returns same hash for same token", async () => {
    const hash1 = await hashSessionTokenAsync("test-token");
    const hash2 = await hashSessionTokenAsync("test-token");
    expect(hash1).toBe(hash2);
  });
});

describe("getSessionExpiry", () => {
  it("returns ISO timestamp in the future", () => {
    const expiry = getSessionExpiry();
    expect(expiry).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const expiryTime = new Date(expiry).getTime();
    expect(expiryTime).toBeGreaterThan(Date.now());
  });

  it("uses custom duration", () => {
    const expiry = getSessionExpiry(60_000);
    const expiryTime = new Date(expiry).getTime();
    const expected = Date.now() + 60_000;
    expect(Math.abs(expiryTime - expected)).toBeLessThan(1000);
  });
});

describe("isSessionExpired", () => {
  it("returns true for past timestamp", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isSessionExpired(past)).toBe(true);
  });

  it("returns false for future timestamp", () => {
    const future = new Date(Date.now() + 1000).toISOString();
    expect(isSessionExpired(future)).toBe(false);
  });

  it("returns true for current timestamp", () => {
    const now = new Date(Date.now() - 1).toISOString();
    expect(isSessionExpired(now)).toBe(true);
  });
});

describe("isSessionRevoked", () => {
  it("returns false for null", () => {
    expect(isSessionRevoked(null)).toBe(false);
  });

  it("returns true for non-null", () => {
    expect(isSessionRevoked("2024-01-01T00:00:00.000Z")).toBe(true);
  });
});

describe("hashUserAgent", () => {
  it("returns hex hash", async () => {
    const hash = await hashUserAgent("Mozilla/5.0");
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("returns same hash for same user agent", async () => {
    const hash1 = await hashUserAgent("Mozilla/5.0");
    const hash2 = await hashUserAgent("Mozilla/5.0");
    expect(hash1).toBe(hash2);
  });
});

describe("hashIp", () => {
  it("returns hex hash", async () => {
    const hash = await hashIp("192.168.1.1");
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("returns same hash for same IP", async () => {
    const hash1 = await hashIp("192.168.1.1");
    const hash2 = await hashIp("192.168.1.1");
    expect(hash1).toBe(hash2);
  });
});
