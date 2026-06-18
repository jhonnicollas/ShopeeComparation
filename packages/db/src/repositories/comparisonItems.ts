import type { ComparisonItemRow, WeightExtraction, ProductFeatureItem } from "@shopee-research/shared";

export interface SaveWeightInput {
  id: string;
  productId: string;
  weight: WeightExtraction;
}

export interface SaveFeaturesInput {
  productId: string;
  features: ProductFeatureItem[];
}

export async function saveProductWeight(
  db: D1Database,
  input: SaveWeightInput
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_productWeights (
        id, productId, value, unit, rawText, source, confidence, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.productId,
      input.weight.value,
      input.weight.unit,
      input.weight.rawText,
      input.weight.source,
      input.weight.confidence,
      now
    )
    .run();
}

export async function saveProductFeatures(
  db: D1Database,
  input: SaveFeaturesInput
): Promise<void> {
  const now = new Date().toISOString();
  for (const feature of input.features) {
    await db
      .prepare(
        `INSERT INTO sh_productFeatures (
          id, productId, name, value, source, confidence, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        input.productId,
        feature.name,
        feature.value,
        feature.source,
        feature.confidence,
        now
      )
      .run();
  }
}

export async function deleteProductWeightsAndFeatures(
  db: D1Database,
  productId: string
): Promise<void> {
  await db
    .prepare("DELETE FROM sh_productWeights WHERE productId = ?")
    .bind(productId)
    .run();
  await db
    .prepare("DELETE FROM sh_productFeatures WHERE productId = ?")
    .bind(productId)
    .run();
}

export interface CreateComparisonItemInput {
  id: string;
  comparisonId: string;
  productId: string;
  shopId: string | null;
  rank: number;
  finalScore: number;
  ratingScore: number;
  reviewCountScore: number;
  soldCountScore: number;
  priceScore: number;
  shopTrustScore: number;
  responseRateScore: number;
  featureMatchScore: number;
  riskPenalty: number;
  prosJson: string[] | null;
  consJson: string[] | null;
  riskJson: string[] | null;
}

export async function createComparisonItem(
  db: D1Database,
  input: CreateComparisonItemInput
): Promise<ComparisonItemRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_comparisonItems (
        id, comparisonId, productId, shopId, rank,
        finalScore, ratingScore, reviewCountScore, soldCountScore, priceScore,
        shopTrustScore, responseRateScore, featureMatchScore, riskPenalty,
        prosJson, consJson, riskJson, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.comparisonId,
      input.productId,
      input.shopId,
      input.rank,
      input.finalScore,
      input.ratingScore,
      input.reviewCountScore,
      input.soldCountScore,
      input.priceScore,
      input.shopTrustScore,
      input.responseRateScore,
      input.featureMatchScore,
      input.riskPenalty,
      input.prosJson ? JSON.stringify(input.prosJson) : null,
      input.consJson ? JSON.stringify(input.consJson) : null,
      input.riskJson ? JSON.stringify(input.riskJson) : null,
      now
    )
    .run();
  const result = await findComparisonItemById(db, input.id);
  if (!result) {
    throw new Error("Failed to create comparison item");
  }
  return result;
}

export async function findComparisonItemById(
  db: D1Database,
  id: string
): Promise<ComparisonItemRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_comparisonItems WHERE id = ?")
    .bind(id)
    .first<ComparisonItemRow>();
  return result ?? null;
}

export async function listComparisonItemsByComparison(
  db: D1Database,
  comparisonId: string
): Promise<ComparisonItemRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_comparisonItems WHERE comparisonId = ? ORDER BY rank"
    )
    .bind(comparisonId)
    .all<ComparisonItemRow>();
  return result.results ?? [];
}
