import type { ResearchSessionRow } from "@shopee-research/shared";

export interface CreateResearchSessionInput {
  id: string;
  userId: string;
  mode: string;
  keyword: string | null;
  shippedFrom: string | null;
  status: string;
}

export async function findResearchSessionById(
  db: D1Database,
  id: string
): Promise<ResearchSessionRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_researchSessions WHERE id = ?")
    .bind(id)
    .first<ResearchSessionRow>();
  return result ?? null;
}

export async function createResearchSession(
  db: D1Database,
  input: CreateResearchSessionInput
): Promise<ResearchSessionRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_researchSessions (id, userId, mode, keyword, shippedFrom, status, totalProducts, completedProducts, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
    )
    .bind(
      input.id,
      input.userId,
      input.mode,
      input.keyword,
      input.shippedFrom,
      input.status,
      now,
      now
    )
    .run();
  const result = await findResearchSessionById(db, input.id);
  if (!result) {
    throw new Error("Failed to create research session");
  }
  return result;
}

export async function updateResearchSessionStatus(
  db: D1Database,
  id: string,
  status: string,
  updates?: {
    bestProductId?: string;
    totalProducts?: number;
    completedProducts?: number;
    errorMessage?: string;
  }
): Promise<void> {
  const fields: string[] = ["status = ?", "updatedAt = ?"];
  const values: unknown[] = [status, new Date().toISOString()];
  if (updates?.bestProductId !== undefined) {
    fields.push("bestProductId = ?");
    values.push(updates.bestProductId);
  }
  if (updates?.totalProducts !== undefined) {
    fields.push("totalProducts = ?");
    values.push(updates.totalProducts);
  }
  if (updates?.completedProducts !== undefined) {
    fields.push("completedProducts = ?");
    values.push(updates.completedProducts);
  }
  if (updates?.errorMessage !== undefined) {
    fields.push("errorMessage = ?");
    values.push(updates.errorMessage);
  }
  values.push(id);
  await db
    .prepare(`UPDATE sh_researchSessions SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}
