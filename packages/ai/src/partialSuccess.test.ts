import { describe, expect, it } from "vitest";
import {
  processItemsWithPartialSuccess,
  summarizeAttempts,
  isPartialSuccess,
  type ItemAttempt,
} from "./partialSuccess.js";

describe("summarizeAttempts", () => {
  it("returns failed when all attempts fail", () => {
    const attempts: ItemAttempt<string>[] = [
      { item: "a", status: "failed", error: "fail", durationMs: 1 },
      { item: "b", status: "failed", error: "fail", durationMs: 1 },
    ];
    const result = summarizeAttempts(attempts);
    expect(result.status).toBe("failed");
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(2);
  });

  it("returns completed when all succeed", () => {
    const attempts: ItemAttempt<string>[] = [
      { item: "a", status: "success", durationMs: 1 },
      { item: "b", status: "success", durationMs: 1 },
    ];
    const result = summarizeAttempts(attempts);
    expect(result.status).toBe("completed");
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
  });

  it("returns partialSuccess when some succeed and some fail", () => {
    const attempts: ItemAttempt<string>[] = [
      { item: "a", status: "success", durationMs: 1 },
      { item: "b", status: "failed", error: "fail", durationMs: 1 },
    ];
    const result = summarizeAttempts(attempts);
    expect(result.status).toBe("partialSuccess");
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
  });

  it("returns failed when no attempts", () => {
    const result = summarizeAttempts([]);
    expect(result.status).toBe("failed");
  });
});

describe("processItemsWithPartialSuccess", () => {
  it("processes all items successfully", async () => {
    const items = ["a", "b", "c"];
    const result = await processItemsWithPartialSuccess(items, async (item) => `ok-${item}`);
    expect(result.status).toBe("completed");
    expect(result.successCount).toBe(3);
  });

  it("captures partial success when some items fail", async () => {
    const items = ["a", "b", "c"];
    const result = await processItemsWithPartialSuccess(items, async (item) => {
      if (item === "b") throw new Error("fail");
      return `ok-${item}`;
    });
    expect(result.status).toBe("partialSuccess");
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(result.failed[0]?.item).toBe("b");
    expect(result.failed[0]?.error).toBe("fail");
  });

  it("captures all failures", async () => {
    const items = ["a", "b"];
    const result = await processItemsWithPartialSuccess(items, async () => {
      throw new Error("always fail");
    });
    expect(result.status).toBe("failed");
    expect(result.failureCount).toBe(2);
  });

  it("records duration for each attempt", async () => {
    const items = ["a"];
    const result = await processItemsWithPartialSuccess(items, async () => {
      await new Promise((r) => setTimeout(r, 10));
      return "ok";
    });
    expect(result.successful[0]?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("stores results for successful attempts", async () => {
    const items = ["a", "b"];
    const result = await processItemsWithPartialSuccess(items, async (item) => `result-${item}`);
    expect(result.successful[0]?.result).toBe("result-a");
    expect(result.successful[1]?.result).toBe("result-b");
  });

  it("handles non-Error throws", async () => {
    const items = ["a"];
    const result = await processItemsWithPartialSuccess(items, async () => {
      throw "string error";
    });
    expect(result.failed[0]?.error).toBe("string error");
  });
});

describe("isPartialSuccess", () => {
  it("returns true for partialSuccess", () => {
    const result = {
      status: "partialSuccess" as const,
      successful: [],
      failed: [],
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    expect(isPartialSuccess(result)).toBe(true);
  });

  it("returns false for completed", () => {
    const result = {
      status: "completed" as const,
      successful: [],
      failed: [],
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    expect(isPartialSuccess(result)).toBe(false);
  });

  it("returns false for failed", () => {
    const result = {
      status: "failed" as const,
      successful: [],
      failed: [],
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    expect(isPartialSuccess(result)).toBe(false);
  });
});
