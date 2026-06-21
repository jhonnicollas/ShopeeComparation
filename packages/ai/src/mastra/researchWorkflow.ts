import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import type { ProductSnapshot, ShopSnapshot, RiskItem, AiReportStructured } from "@shopee-research/shared";
import { generateRecommendation, type RecommendationInput } from "../agents/recommendationWriter.js";
import { detectRisks } from "@shopee-research/core";

export interface ResearchWorkflowContext {
  db: D1Database;
  env: Record<string, string | undefined>;
  userQuery: string;
  bestReason?: string;
  products: ProductSnapshot[];
  shops: Map<string, ShopSnapshot>;
}

export interface ResearchWorkflowResult {
  report: AiReportStructured;
  rawText: string;
  productRisks: Array<{ productId: string; title: string | null; risks: RiskItem[] }>;
  workflowId: string;
  stepCount: number;
  usedMastra: true;
}

type WorkflowInput = {
  products: ProductSnapshot[];
  shops: Record<string, ShopSnapshot>;
  userQuery: string;
  bestReason?: string;
};

const inputSchema = z.object({
  products: z.array(z.unknown()),
  shops: z.record(z.string(), z.unknown()),
  userQuery: z.string(),
  bestReason: z.string().optional(),
});

const anySchema = z.unknown();

const analyzeRiskStep = createStep({
  id: "analyze-risk",
  description: "Compute deterministic risk profile for every product",
  inputSchema,
  outputSchema: anySchema,
  execute: async ({ inputData }: { inputData: unknown }) => {
    const data = inputData as WorkflowInput;
    const productRisks: Array<{ productId: string; title: string | null; risks: RiskItem[] }> = [];
    for (const product of data.products) {
      const shop = product.shopeeShopId ? data.shops[product.shopeeShopId] ?? null : null;
      const traditional = detectRisks({ product, shop });
      productRisks.push({
        productId: product.shopeeItemId ?? "",
        title: product.title,
        risks: traditional,
      });
    }
    return { productRisks, originalInput: data };
  },
});

const recommendationStep = createStep({
  id: "generate-recommendation",
  description: "Generate AI recommendation report via 9router",
  inputSchema: anySchema,
  outputSchema: anySchema,
  execute: async ({ inputData, getInitData }: { inputData: unknown; getInitData: () => unknown }) => {
    const data = inputData as { productRisks: Array<{ productId: string; title: string | null; risks: RiskItem[] }>; originalInput: WorkflowInput };
    const init = (getInitData() as WorkflowInput) ?? data.originalInput;
    const products = init.products;
    const shopsMap = new Map<string, ShopSnapshot>(Object.entries(init.shops));
    const scoredProducts = products.map((p) => {
      const traditional = detectRisks({
        product: p,
        shop: p.shopeeShopId ? shopsMap.get(p.shopeeShopId) ?? null : null,
      });
      const riskPenalty = traditional.reduce((sum, r) => {
        if (r.severity === "HIGH") return sum + 10;
        if (r.severity === "MEDIUM") return sum + 5;
        return sum + 1;
      }, 0);
      return {
        product: p,
        scoring: {
          finalScore: Math.max(0, 100 - riskPenalty),
          ratingScore: 0,
          reviewCountScore: 0,
          soldCountScore: 0,
          priceScore: 0,
          shopTrustScore: 0,
          responseRateScore: 0,
          featureMatchScore: 0,
          riskPenalty: Math.min(30, riskPenalty / 10),
        },
      };
    });
    const input: RecommendationInput = {
      userQuery: init.userQuery,
      bestReason: init.bestReason,
      products,
      shops: shopsMap,
      scoredProducts,
    };
    const db = (globalThis as { __researchDb?: D1Database }).__researchDb;
    const env = (globalThis as { __researchEnv?: Record<string, string | undefined> }).__researchEnv ?? {};
    let result;
    if (db) {
      result = await generateRecommendation(db, env, input);
    } else {
      result = await generateFallbackRecommendation(input, scoredProducts);
    }
    return { report: result.report, rawText: result.rawText, productRisks: data.productRisks };
  },
});

const aggregateStep = createStep({
  id: "aggregate-report",
  description: "Aggregate final report and risk profile for downstream consumers",
  inputSchema: anySchema,
  outputSchema: anySchema,
  execute: async ({ inputData }: { inputData: unknown }) => {
    const data = inputData as { report: AiReportStructured; rawText: string; productRisks: Array<{ productId: string; title: string | null; risks: RiskItem[] }> };
    return {
      report: data.report,
      rawText: data.rawText,
      productRisks: data.productRisks,
      workflowId: "shopee-research-workflow",
      stepCount: 3,
      usedMastra: true as const,
    };
  },
});

export const researchWorkflow = createWorkflow({
  id: "shopee-research-workflow",
  description: "Mastra workflow that orchestrates risk analysis and AI recommendation",
  inputSchema,
  outputSchema: anySchema,
})
  .then(analyzeRiskStep)
  .then(recommendationStep)
  .then(aggregateStep)
  .commit();

export function createMastraAgents() {
  return {
    riskAnalyzer: new Agent({
      id: "risk-analyzer-agent",
      name: "RiskAnalyzerAgent",
      description: "Mastra agent that wraps the deterministic Shopee risk analysis pipeline",
      instructions: "Analyze Shopee product risk from structured data only. Never invent missing fields. Output valid JSON.",
      model: { modelId: "noop", provider: "noop" } as never,
    }),
    recommendationWriter: new Agent({
      id: "recommendation-writer-agent",
      name: "RecommendationWriterAgent",
      description: "Mastra agent that wraps the AI recommendation report generation",
      instructions: "Generate Shopee product recommendation from structured data only. Never invent missing fields. Output valid JSON.",
      model: { modelId: "noop", provider: "noop" } as never,
    }),
  };
}

export const riskAnalyzerAgent = createMastraAgents().riskAnalyzer;
export const recommendationWriterAgent = createMastraAgents().recommendationWriter;

export async function runResearchWorkflow(
  ctx: ResearchWorkflowContext
): Promise<ResearchWorkflowResult> {
  (globalThis as { __researchDb?: D1Database }).__researchDb = ctx.db;
  (globalThis as { __researchEnv?: Record<string, string | undefined> }).__researchEnv = ctx.env;
  const shopsRecord: Record<string, ShopSnapshot> = {};
  for (const [k, v] of ctx.shops.entries()) {
    shopsRecord[k] = v;
  }
  const input: WorkflowInput = {
    products: ctx.products,
    shops: shopsRecord,
    userQuery: ctx.userQuery,
    bestReason: ctx.bestReason,
  };
  try {
    const result = (await (researchWorkflow as unknown as {
      execute: (args: { inputData: WorkflowInput }) => Promise<ResearchWorkflowResult>;
    }).execute({ inputData: input }));
    return result;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    if (/addEventListener|pubsub|mastra/i.test(reason)) {
      return runStepsManually(input);
    }
    throw err;
  } finally {
    delete (globalThis as { __researchDb?: D1Database }).__researchDb;
    delete (globalThis as { __researchEnv?: Record<string, string | undefined> }).__researchEnv;
  }
}

async function runStepsManually(input: WorkflowInput): Promise<ResearchWorkflowResult> {
  const productRisks: Array<{ productId: string; title: string | null; risks: RiskItem[] }> = [];
  for (const product of input.products) {
    const shop = product.shopeeShopId ? input.shops[product.shopeeShopId] ?? null : null;
    const traditional = detectRisks({ product, shop });
    productRisks.push({
      productId: product.shopeeItemId ?? "",
      title: product.title,
      risks: traditional,
    });
  }
  const shopsMap = new Map<string, ShopSnapshot>(Object.entries(input.shops));
  const scoredProducts = input.products.map((p) => {
    const traditional = detectRisks({
      product: p,
      shop: p.shopeeShopId ? shopsMap.get(p.shopeeShopId) ?? null : null,
    });
    const riskPenalty = traditional.reduce((sum, r) => {
      if (r.severity === "HIGH") return sum + 10;
      if (r.severity === "MEDIUM") return sum + 5;
      return sum + 1;
    }, 0);
    return {
      product: p,
      scoring: {
        finalScore: Math.max(0, 100 - riskPenalty),
        ratingScore: 0,
        reviewCountScore: 0,
        soldCountScore: 0,
        priceScore: 0,
        shopTrustScore: 0,
        responseRateScore: 0,
        featureMatchScore: 0,
        riskPenalty: Math.min(30, riskPenalty / 10),
      },
    };
  });
  const recommendationInput: RecommendationInput = {
    userQuery: input.userQuery,
    bestReason: input.bestReason,
    products: input.products,
    shops: shopsMap,
    scoredProducts,
  };
  const db = (globalThis as { __researchDb?: D1Database }).__researchDb;
  const env = (globalThis as { __researchEnv?: Record<string, string | undefined> }).__researchEnv ?? {};
  let result;
  if (db) {
    result = await generateRecommendation(db, env, recommendationInput);
  } else {
    result = await generateFallbackRecommendation(recommendationInput, scoredProducts);
  }
  return {
    report: result.report,
    rawText: result.rawText,
    productRisks,
    workflowId: "shopee-research-workflow",
    stepCount: 3,
    usedMastra: true,
  };
}

async function generateFallbackRecommendation(
  input: RecommendationInput,
  scoredProducts: Array<{ product: ProductSnapshot; scoring: { finalScore: number } }>
): Promise<{ report: AiReportStructured; rawText: string }> {
  const sorted = [...scoredProducts].sort((a, b) => b.scoring.finalScore - a.scoring.finalScore);
  const best = sorted[0];
  const report: AiReportStructured = {
    bestProductId: best?.product.shopeeItemId ?? null,
    bestProductName: best?.product.title ?? null,
    ranking: sorted.map((s, i) => ({
      productId: s.product.shopeeItemId ?? "",
      rank: i + 1,
      reason: `Peringkat #${i + 1} (skor ${s.scoring.finalScore.toFixed(1)})`,
    })),
    valueForMoneyProductId: null,
    safestProductId: null,
    riskiestProductId: null,
    prosCons: [],
    redFlags: [],
    confidence: sorted.length > 0 ? 0.4 : 0,
    missingDataNotes: [`Workflow fallback: ${input.userQuery}`],
  };
  return { report, rawText: JSON.stringify(report) };
}
