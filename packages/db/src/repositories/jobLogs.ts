import type { JobLogRow } from "@shopee-research/shared";

export type JobLogLevel = "info" | "warn" | "error" | "debug";

export interface CreateJobLogInput {
  id: string;
  jobId: string;
  level: JobLogLevel;
  message: string;
  metadataJson?: string | null;
}

export interface ListJobLogsOptions {
  jobId?: string;
  level?: JobLogLevel;
  limit?: number;
}

export async function createJobLog(
  db: D1Database,
  input: CreateJobLogInput
): Promise<JobLogRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_jobLogs (id, jobId, level, message, metadataJson, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(input.id, input.jobId, input.level, input.message, input.metadataJson ?? null, now)
    .run();
  const result = await db
    .prepare("SELECT * FROM sh_jobLogs WHERE id = ?")
    .bind(input.id)
    .first<JobLogRow>();
  if (!result) throw new Error("Failed to create job log");
  return result;
}

export async function listJobLogsByJob(
  db: D1Database,
  jobId: string,
  limit = 100
): Promise<JobLogRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_jobLogs WHERE jobId = ? ORDER BY createdAt ASC LIMIT ?"
    )
    .bind(jobId, limit)
    .all<JobLogRow>();
  return result.results ?? [];
}

export async function listJobLogs(
  db: D1Database,
  options: ListJobLogsOptions = {}
): Promise<JobLogRow[]> {
  const limit = options.limit ?? 100;
  if (options.jobId && options.level) {
    const result = await db
      .prepare(
        "SELECT * FROM sh_jobLogs WHERE jobId = ? AND level = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .bind(options.jobId, options.level, limit)
      .all<JobLogRow>();
    return result.results ?? [];
  }
  if (options.jobId) {
    return listJobLogsByJob(db, options.jobId, limit);
  }
  if (options.level) {
    const result = await db
      .prepare(
        "SELECT * FROM sh_jobLogs WHERE level = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .bind(options.level, limit)
      .all<JobLogRow>();
    return result.results ?? [];
  }
  const result = await db
    .prepare(
      "SELECT * FROM sh_jobLogs ORDER BY createdAt DESC LIMIT ?"
    )
    .bind(limit)
    .all<JobLogRow>();
  return result.results ?? [];
}