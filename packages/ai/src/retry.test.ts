import { describe, expect, it, vi } from "vitest";
import { withRetry, isRetryableError, calculateDelay } from "./retry.js";

describe("retry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable error", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws on non-retryable error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("invalid input"));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 })).rejects.toThrow("invalid input");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("timeout"));
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 })).rejects.toThrow("timeout");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("identifies retryable errors", () => {
    expect(isRetryableError(new Error("timeout"))).toBe(true);
    expect(isRetryableError(new Error("network error"))).toBe(true);
    expect(isRetryableError(new Error("502 Bad Gateway"))).toBe(true);
    expect(isRetryableError(new Error("429 Too Many Requests"))).toBe(true);
    expect(isRetryableError(new Error("invalid input"))).toBe(false);
    expect(isRetryableError("not an error")).toBe(false);
  });

  it("calculates exponential backoff delay", () => {
    const config = { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 };
    expect(calculateDelay(0, config)).toBe(1000);
    expect(calculateDelay(1, config)).toBe(2000);
    expect(calculateDelay(2, config)).toBe(4000);
    expect(calculateDelay(10, config)).toBe(10000);
  });
});
