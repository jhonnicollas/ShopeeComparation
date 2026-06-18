import type { QueueMessage } from "@shopee-research/shared";
import { runWorkflowSteps } from "./runner.js";

export interface CompareLinksContext {
  message: QueueMessage;
  db: D1Database;
}

export interface CompareLinksResult {
  comparisonId: string;
  bestProductId: string | null;
}

export async function runCompareLinksWorkflow(
  ctx: CompareLinksContext
): Promise<CompareLinksResult> {
  const steps = [
    {
      name: "validate",
      run: async (input: CompareLinksContext): Promise<CompareLinksContext> => {
        if (!input.message.links || input.message.links.length === 0) {
          throw new Error("No links provided");
        }
        return input;
      },
    },
    {
      name: "resolve",
      run: async (input: CompareLinksContext): Promise<CompareLinksContext & { resolvedUrls: string[] }> => {
        return { ...input, resolvedUrls: input.message.links ?? [] };
      },
    },
    {
      name: "extract",
      run: async (input: CompareLinksContext & { resolvedUrls: string[] }): Promise<CompareLinksContext & { products: Array<{ id: string; url: string }> }> => {
        return {
          ...input,
          products: input.resolvedUrls.map((url, i) => ({
            id: `prd_mock_${i}`,
            url,
          })),
        };
      },
    },
    {
      name: "score",
      run: async (input: CompareLinksContext & { products: Array<{ id: string; url: string }> }): Promise<CompareLinksContext & { products: Array<{ id: string; url: string }>; scores: Array<{ productId: string; finalScore: number }> }> => {
        return {
          ...input,
          scores: input.products.map((p, i) => ({
            productId: p.id,
            finalScore: 0.9 - i * 0.1,
          })),
        };
      },
    },
    {
      name: "rank",
      run: async (
        input: CompareLinksContext & {
          scores: Array<{ productId: string; finalScore: number }>;
        }
      ): Promise<CompareLinksContext & CompareLinksResult> => {
        const best = input.scores.reduce((a, b) => (a.finalScore > b.finalScore ? a : b));
        return {
          ...input,
          comparisonId: `cmp_${Date.now()}`,
          bestProductId: best.productId,
        };
      },
    },
  ];

  const results = await runWorkflowSteps(
    steps as Array<{ name: string; run: (input: CompareLinksContext) => Promise<unknown> }>,
    ctx
  );
  const lastResult = results[results.length - 1];
  if (!lastResult || !lastResult.success || !lastResult.data) {
    const failedStep = results.find((r) => !r.success);
    throw new Error(failedStep?.error ?? "Workflow failed");
  }
  const data = lastResult.data as CompareLinksContext & CompareLinksResult;
  return {
    comparisonId: data.comparisonId,
    bestProductId: data.bestProductId,
  };
}
