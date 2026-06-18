import type { AiReportStructured, ProductSnapshot, ShopSnapshot } from "@shopee-research/shared";
import { chat } from "../nineRouter/client.js";

export interface RecommendationInput {
  products: ProductSnapshot[];
  shops: Map<string, ShopSnapshot>;
  userQuery: string;
}

export interface RecommendationOutput {
  report: AiReportStructured;
  rawText: string;
}

const RECOMMENDATION_PROMPT = `You are a product recommendation AI.
Given the following Shopee products with structured data, generate a JSON recommendation report.

Products:
{PRODUCTS_JSON}

User Query: {USER_QUERY}

Output format (JSON only):
{
  "bestProductId": "<id of best product>",
  "bestReason": "<why this is best>",
  "rankedIds": ["id1", "id2", ...],
  "valueForMoneyId": "<best value product>",
  "safestId": "<lowest risk product>",
  "riskiestId": "<highest risk product>",
  "prosCons": [
    {"productId": "id1", "pros": ["..."], "cons": ["..."]}
  ],
  "redFlags": ["<risk description>"],
  "confidence": 0.85,
  "notes": "<any notes>"
}`;

export function buildPrompt(input: RecommendationInput): string {
  const productsJson = input.products.map((p) => ({
    id: p.shopeeItemId,
    shopId: p.shopeeShopId,
    title: p.title,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    rating: p.rating,
    reviewCount: p.reviewCount,
    soldCount: p.soldCount,
    shippedFrom: p.shippedFrom,
    shop: p.shopeeShopId ? input.shops.get(p.shopeeShopId) : null,
  }));
  let prompt = RECOMMENDATION_PROMPT.replace("{PRODUCTS_JSON}", JSON.stringify(productsJson, null, 2));
  prompt = prompt.replace("{USER_QUERY}", input.userQuery);
  return prompt;
}

export async function generateRecommendation(
  db: D1Database,
  env: Record<string, string | undefined>,
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const prompt = buildPrompt(input);
  const response = await chat(db, env, {
    prompt,
    providerKey: "9router",
    modelKey: "primary",
    jsonMode: true,
    temperature: 0.3,
  });
  let report: AiReportStructured;
  try {
    const parsed = JSON.parse(response.text) as Partial<AiReportStructured>;
    report = {
      bestProductId: parsed.bestProductId ?? null,
      bestProductName: parsed.bestProductName ?? null,
      ranking: parsed.ranking ?? [],
      valueForMoneyProductId: parsed.valueForMoneyProductId ?? null,
      safestProductId: parsed.safestProductId ?? null,
      riskiestProductId: parsed.riskiestProductId ?? null,
      prosCons: parsed.prosCons ?? [],
      redFlags: parsed.redFlags ?? [],
      confidence: parsed.confidence ?? 0,
      missingDataNotes: parsed.missingDataNotes ?? [],
    };
  } catch {
    report = {
      bestProductId: null,
      bestProductName: null,
      ranking: input.products.map((p, i) => ({
        productId: p.shopeeItemId ?? "",
        rank: i + 1,
        reason: "AI could not parse structured report",
      })),
      valueForMoneyProductId: null,
      safestProductId: null,
      riskiestProductId: null,
      prosCons: [],
      redFlags: [],
      confidence: 0,
      missingDataNotes: [`AI response: ${response.text.slice(0, 200)}`],
    };
  }
  return { report, rawText: response.text };
}
