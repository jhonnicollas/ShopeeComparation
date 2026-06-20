import type { AiReportStructured, ProductSnapshot, ShopSnapshot, ScoringOutput } from "@shopee-research/shared";
import { chat } from "../nineRouter/client.js";
import { detectRisks } from "@shopee-research/core";

export interface RecommendationInput {
  products: ProductSnapshot[];
  shops: Map<string, ShopSnapshot>;
  userQuery: string;
  scoredProducts?: Array<{
    product: ProductSnapshot;
    scoring: ScoringOutput;
  }>;
}

export interface RecommendationOutput {
  report: AiReportStructured;
  rawText: string;
}

function generatePros(product: ProductSnapshot, score: number): string[] {
  const pros: string[] = [];
  if (product.rating && product.rating >= 4.5) pros.push(`Rating tinggi (${product.rating}/5)`);
  if (product.reviewCount && product.reviewCount >= 500) pros.push(`Banyak review (${product.reviewCount})`);
  if (product.soldCount && product.soldCount >= 1000) pros.push(`Terjual banyak (${product.soldCount})`);
  if (product.shippedFrom === "DKI Jakarta") pros.push("Dikirim dari DKI Jakarta");
  if (product.features && product.features.length >= 3) {
    for (const f of product.features.slice(0, 2)) {
      pros.push(`${f.name}: ${f.value}`);
    }
  }
  if (score >= 0.8) pros.push("Skor keseluruhan tinggi");
  if (product.favoriteCount && product.favoriteCount >= 200) pros.push(`Populer (${product.favoriteCount} favorit)`);
  return pros.length > 0 ? pros : ["Data terbatas"];
}

function generateCons(product: ProductSnapshot): string[] {
  const cons: string[] = [];
  if (product.rating && product.rating < 4.0) cons.push(`Rating rendah (${product.rating}/5)`);
  if (product.reviewCount !== null && product.reviewCount < 100) cons.push("Sedikit review");
  if (product.soldCount !== null && product.soldCount < 100) cons.push("Sedikit yang beli");
  if (product.priceMin && product.priceMin > 300000) cons.push("Harga relatif tinggi");
  if (product.stock !== null && product.stock < 10) cons.push("Stok terbatas");
  if (!product.description || product.description.length < 20) cons.push("Deskripsi minim");
  return cons.length > 0 ? cons : ["Tidak ada kelemahan signifikan"];
}

function generateMissingDataNotes(products: ProductSnapshot[]): string[] {
  const notes: string[] = [];
  const missingFields: string[] = [];
  for (const p of products) {
    if (p.rating === null) missingFields.push("rating");
    if (p.reviewCount === null) missingFields.push("reviewCount");
    if (p.soldCount === null) missingFields.push("soldCount");
    if (p.priceMin === null) missingFields.push("price");
    if (!p.weight?.value) missingFields.push("berat");
    if (!p.description) missingFields.push("deskripsi");
    if (!p.features || p.features.length === 0) missingFields.push("fitur");
  }
  const uniqueMissing = [...new Set(missingFields)];
  if (uniqueMissing.length > 0) {
    notes.push(`Data tidak tersedia: ${uniqueMissing.join(", ")}`);
  }
  return notes;
}

function calculateValueForMoney(
  products: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): string | null {
  if (products.length === 0) return null;
  const withRatio = products
    .filter((p) => p.product.priceMin && p.product.priceMin > 0)
    .map((p) => ({
      productId: p.product.shopeeItemId ?? "",
      ratio: p.scoring.finalScore / Math.log10(p.product.priceMin! + 10),
    }));
  if (withRatio.length === 0) return null;
  withRatio.sort((a, b) => b.ratio - a.ratio);
  return withRatio[0]!.productId;
}

function calculateSafest(
  products: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): string | null {
  if (products.length === 0) return null;
  const withRisk = products.map((p) => {
    const risks = detectRisks({
      product: p.product,
      shop: null,
    });
    return { productId: p.product.shopeeItemId ?? "", totalPenalty: risks.reduce((sum, r) => sum + (r.severity === "HIGH" ? 3 : r.severity === "MEDIUM" ? 2 : 1), 0) };
  });
  withRisk.sort((a, b) => a.totalPenalty - b.totalPenalty);
  return withRisk[0]!.productId;
}

function calculateRiskiest(
  products: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): string | null {
  if (products.length === 0) return null;
  const withRisk = products.map((p) => {
    const risks = detectRisks({
      product: p.product,
      shop: null,
    });
    return { productId: p.product.shopeeItemId ?? "", totalPenalty: risks.reduce((sum, r) => sum + (r.severity === "HIGH" ? 3 : r.severity === "MEDIUM" ? 2 : 1), 0) };
  });
  withRisk.sort((a, b) => b.totalPenalty - a.totalPenalty);
  return withRisk[0]!.productId;
}

function aggregateRedFlags(
  products: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): string[] {
  const flags: string[] = [];
  for (const p of products) {
    const risks = detectRisks({ product: p.product, shop: null });
    for (const r of risks) {
      if (r.severity === "HIGH") {
        flags.push(`${p.product.title}: ${r.message}`);
      }
    }
  }
  return [...new Set(flags)];
}

export function generateDeterministicReport(
  scoredProducts: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>
): AiReportStructured {
  const sorted = [...scoredProducts].sort((a, b) => b.scoring.finalScore - a.scoring.finalScore);

  const best = sorted[0];
  const products = sorted.map((s) => s.product);

  const ranking = sorted.map((s, i) => {
    const reasonParts: string[] = [];
    if (s.scoring.finalScore >= 0.8) reasonParts.push("skor tinggi");
    if (s.product.rating && s.product.rating >= 4.5) reasonParts.push(`rating ${s.product.rating}`);
    if (s.product.reviewCount && s.product.reviewCount >= 500) reasonParts.push(`${s.product.reviewCount} review`);
    const reason = reasonParts.length > 0
      ? `Peringkat #${i + 1} karena ${reasonParts.join(", ")}`
      : `Peringkat #${i + 1}`;
    return {
      productId: s.product.shopeeItemId ?? "",
      rank: i + 1,
      reason,
    };
  });

  const bestProduct = best?.product;
  const bestProductId = bestProduct?.shopeeItemId ?? null;

  const valueForMoneyId = calculateValueForMoney(sorted);
  const safestId = calculateSafest(sorted);
  const riskiestId = calculateRiskiest(sorted);

  const prosCons = sorted.map((s) => ({
    productId: s.product.shopeeItemId ?? "",
    pros: generatePros(s.product, s.scoring.finalScore),
    cons: generateCons(s.product),
  }));

  const redFlags = aggregateRedFlags(sorted);

  const missingDataNotes = generateMissingDataNotes(products);

  const avgConfidence = sorted.length > 0
    ? sorted.reduce((sum, s) => sum + (s.product.confidenceScore ?? 1), 0) / sorted.length
    : 0;

  return {
    bestProductId,
    bestProductName: bestProduct?.title ?? null,
    ranking,
    valueForMoneyProductId: valueForMoneyId,
    safestProductId: safestId,
    riskiestProductId: riskiestId,
    prosCons,
    redFlags,
    confidence: Math.round(avgConfidence * 100) / 100,
    missingDataNotes,
  };
}

export function generateBestReason(scoredProducts: Array<{ product: ProductSnapshot; scoring: ScoringOutput }>): string {
  const sorted = [...scoredProducts].sort((a, b) => b.scoring.finalScore - a.scoring.finalScore);
  const best = sorted[0];
  if (!best) return "Tidak ada data produk untuk dinilai.";
  const p = best.product;
  const reasons: string[] = [];
  if (p.rating && p.rating >= 4.5) reasons.push(`rating ${p.rating}/5`);
  if (p.reviewCount && p.reviewCount >= 500) reasons.push(`${p.reviewCount} review dari pembeli`);
  if (p.soldCount && p.soldCount >= 1000) reasons.push(`${p.soldCount} unit terjual`);
  if (p.shippedFrom === "DKI Jakarta") reasons.push("pengiriman dari DKI Jakarta");
  if (reasons.length === 0) {
    return `${p.title} memiliki skor tertinggi (${(best.scoring.finalScore * 100).toFixed(1)}/100).`;
  }
  return `${p.title} memiliki skor tertinggi dengan: ${reasons.join(", ")}.`;
}

const RECOMMENDATION_PROMPT = `You are a product recommendation AI.
Given the following Shopee products with structured data, generate a JSON recommendation report.

Products:
{PRODUCTS_JSON}

User Query: {USER_QUERY}

Output format (JSON only):
{
  "bestProductId": "<id of best product>",
  "bestProductName": "<name of best product>",
  "bestReason": "<why this is best>",
  "ranking": [{"productId": "id1", "rank": 1, "reason": "..."}],
  "valueForMoneyProductId": "<best value product>",
  "valueForMoneyName": "<name of value product>",
  "safestProductId": "<lowest risk product>",
  "riskiestProductId": "<highest risk product>",
  "prosCons": [
    {"productId": "id1", "pros": ["..."], "cons": ["..."]}
  ],
  "redFlags": ["<risk description>"],
  "confidence": 0.85,
  "missingDataNotes": ["<any notes>"]
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
  if (input.scoredProducts && input.scoredProducts.length > 0) {
    const report = generateDeterministicReport(input.scoredProducts);
    const rawText = JSON.stringify(report);
    return { report, rawText };
  }

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