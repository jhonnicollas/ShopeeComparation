import type { JobRow } from "@shopee-research/shared";

export interface CreateJobInput {
  id: string;
  userId: string;
  researchSessionId: string | null;
  type: string;
  status: string;
  payloadJson: string | null;
}

export async function findJobById(db: D1Database, id: string): Promise<JobRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_jobs WHERE id = ?")
    .bind(id)
    .first<JobRow>();
  return result ?? null;
}

export async function createJob(db: D1Database, input: CreateJobInput): Promise<JobRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_jobs (id, userId, researchSessionId, type, status, progressCurrent, progressTotal, payloadJson, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.userId,
      input.researchSessionId,
      input.type,
      input.status,
      input.payloadJson,
      now,
      now
    )
    .run();
  const result = await findJobById(db, input.id);
  if (!result) {
    throw new Error("Failed to create job");
  }
  return result;
}

export async function updateJobStatus(
  db: D1Database,
  id: string,
  status: string,
  updates?: {
    progressCurrent?: number;
    progressTotal?: number;
    currentStep?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const fields: string[] = ["status = ?", "updatedAt = ?"];
  const values: unknown[] = [status, new Date().toISOString()];
  if (updates?.progressCurrent !== undefined) {
    fields.push("progressCurrent = ?");
    values.push(updates.progressCurrent);
  }
  if (updates?.progressTotal !== undefined) {
    fields.push("progressTotal = ?");
    values.push(updates.progressTotal);
  }
  if (updates?.currentStep !== undefined) {
    fields.push("currentStep = ?");
    values.push(updates.currentStep);
  }
  if (updates?.errorMessage !== undefined) {
    fields.push("errorMessage = ?");
    values.push(updates.errorMessage);
  }
  values.push(id);
  await db
    .prepare(`UPDATE sh_jobs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function listJobsBySession(
  db: D1Database,
  researchSessionId: string
): Promise<JobRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_jobs WHERE researchSessionId = ? ORDER BY createdAt DESC")
    .bind(researchSessionId)
    .all<JobRow>();
  return result.results ?? [];
}

export async function listJobsByUser(db: D1Database, userId: string): Promise<JobRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_jobs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50")
    .bind(userId)
    .all<JobRow>();
  return result.results ?? [];
}

export async function listJobsByStatus(
  db: D1Database,
  status: string,
  limit = 50
): Promise<JobRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_jobs WHERE status = ? ORDER BY createdAt DESC LIMIT ?")
    .bind(status, limit)
    .all<JobRow>();
  return result.results ?? [];
}
