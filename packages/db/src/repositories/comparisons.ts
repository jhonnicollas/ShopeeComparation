import type { ComparisonRow, ComparisonItemRow } from "@shopee-research/shared";

export interface CreateComparisonInput {
  id: string;
  researchSessionId: string;
  userId: string;
  title: string | null;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  bestProductId: string | null;
  summary: string | null;
}

export async function findComparisonById(
  db: D1Database,
  id: string
): Promise<ComparisonRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_comparisons WHERE id = ?")
    .bind(id)
    .first<ComparisonRow>();
  return result ?? null;
}

export async function findComparisonBySession(
  db: D1Database,
  researchSessionId: string
): Promise<ComparisonRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_comparisons WHERE researchSessionId = ? LIMIT 1")
    .bind(researchSessionId)
    .first<ComparisonRow>();
  return result ?? null;
}

export async function createComparison(
  db: D1Database,
  input: CreateComparisonInput
): Promise<ComparisonRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_comparisons (id, researchSessionId, userId, title, mode, keyword, shippedFrom, bestProductId, summary, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.researchSessionId,
      input.userId,
      input.title,
      input.mode,
      input.keyword,
      input.shippedFrom,
      input.bestProductId,
      input.summary,
      now,
      now
    )
    .run();
  const result = await findComparisonById(db, input.id);
  if (!result) {
    throw new Error("Failed to create comparison");
  }
  return result;
}

export async function updateComparisonBest(
  db: D1Database,
  id: string,
  bestProductId: string,
  summary: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE sh_comparisons SET bestProductId = ?, summary = ?, updatedAt = ? WHERE id = ?"
    )
    .bind(bestProductId, summary, now, id)
    .run();
}

export async function listComparisonItemsByComparisonDb(
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
