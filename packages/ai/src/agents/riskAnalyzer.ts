import type { ProductSnapshot, ShopSnapshot, RiskItem } from "@shopee-research/shared";
import { chat } from "../nineRouter/client.js";
import { detectRisks } from "@shopee-research/core";

export interface RiskAnalysisInput {
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

export interface RiskAnalysisOutput {
  traditionalRisks: RiskItem[];
  aiRisks: RiskItem[];
  allRisks: RiskItem[];
}

const RISK_PROMPT = `Analyze the following product/shop for additional risks beyond obvious red flags.
Return JSON only with array of risks: [{"type": "...", "severity": "LOW|MEDIUM|HIGH", "message": "...", "impact": 0.0-1.0}]

Product:
{PRODUCT_JSON}
`;

export async function analyzeRisk(
  db: D1Database,
  env: Record<string, string | undefined>,
  input: RiskAnalysisInput
): Promise<RiskAnalysisOutput> {
  const traditionalRisks = detectRisks(input);
  let aiRisks: RiskItem[] = [];
  try {
    const prompt = RISK_PROMPT.replace(
      "{PRODUCT_JSON}",
      JSON.stringify(
        {
          title: input.product.title,
          brand: input.product.brand,
          priceMin: input.product.priceMin,
          priceBeforeDiscount: input.product.priceBeforeDiscount,
          rating: input.product.rating,
          reviewCount: input.product.reviewCount,
          soldCount: input.product.soldCount,
          shopName: input.shop?.name,
          shopStatus: input.shop?.primaryStatus,
          shopRating: input.shop?.rating,
          responseRate: input.shop?.responseRate,
        },
        null,
        2
      )
    );
    const response = await chat(db, env, {
      prompt,
      providerKey: "9router",
      modelKey: "fast",
      jsonMode: true,
      temperature: 0.2,
    });
    const parsed = JSON.parse(response.text) as Array<{
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      message: string;
      impact?: number;
    }>;
    aiRisks = parsed.map((r) => ({
      type: `ai_${r.type}`,
      severity: r.severity,
      message: r.message,
      impact: r.impact ?? 0.1,
    }));
  } catch {
    aiRisks = [];
  }
  return {
    traditionalRisks,
    aiRisks,
    allRisks: [...traditionalRisks, ...aiRisks],
  };
}
