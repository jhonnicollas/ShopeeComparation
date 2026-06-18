import { describe, expect, it } from "vitest";
import type { QueueMessage } from "@shopee-research/shared";
import { runWorkflowSteps, runWorkflowStep } from "./runner.js";

describe("runWorkflowStep", () => {
  it("returns success for successful step", async () => {
    const result = await runWorkflowStep("test", async (x: number) => x * 2, 5);
    expect(result.success).toBe(true);
    expect(result.data).toBe(10);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("returns error for failed step", async () => {
    const result = await runWorkflowStep("fail", async () => {
      throw new Error("oops");
    }, null);
    expect(result.success).toBe(false);
    expect(result.error).toBe("oops");
  });

  it("handles non-Error throws", async () => {
    const result = await runWorkflowStep("string-throw", async () => {
      throw "string error";
    }, null);
    expect(result.success).toBe(false);
    expect(result.error).toBe("string error");
  });
});

describe("runWorkflowSteps", () => {
  it("chains steps and passes data", async () => {
    const steps = [
      { name: "double", run: async (x: number) => x * 2 },
      { name: "add10", run: async (x: number) => x + 10 },
      { name: "square", run: async (x: number) => x * x },
    ];
    const results = await runWorkflowSteps(steps, 3);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
    const lastResult = results[2];
    expect(lastResult?.data).toBe(256);
  });

  it("stops on first failure", async () => {
    const steps = [
      { name: "step1", run: async (x: number) => x },
      { name: "fail", run: async () => { throw new Error("boom"); } },
      { name: "step3", run: async (x: number) => x },
    ];
    const results = await runWorkflowSteps(steps, 1);
    expect(results).toHaveLength(2);
    expect(results[0]?.success).toBe(true);
    expect(results[1]?.success).toBe(false);
  });
});

describe("runCompareLinksWorkflow", () => {
  it("runs full workflow successfully", async () => {
    const { runCompareLinksWorkflow } = await import("./compareLinks.js");
    const message: QueueMessage = {
      userId: "usr_test",
      researchSessionId: "rsr_test",
      mode: "compareLinks",
      links: ["https://shopee.co.id/p1"],
    };
    const ctx = { message, db: {} as D1Database };
    const result = await runCompareLinksWorkflow(ctx);
    expect(result.comparisonId).toMatch(/^cmp_/);
    expect(result.bestProductId).toBe("prd_mock_0");
  });

  it("fails when no links", async () => {
    const { runCompareLinksWorkflow } = await import("./compareLinks.js");
    const message: QueueMessage = {
      userId: "usr_test",
      researchSessionId: "rsr_test",
      mode: "compareLinks",
    };
    const ctx = { message, db: {} as D1Database };
    await expect(runCompareLinksWorkflow(ctx)).rejects.toThrow("No links");
  });
});
