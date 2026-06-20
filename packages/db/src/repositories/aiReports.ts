import type { AiReportStructured, AiReportRow } from "@shopee-research/shared";

export interface UpsertAiReportInput {
  id: string;
  comparisonId: string;
  userId: string;
  model: string;
  provider: string;
  promptVersion: string;
  report: AiReportStructured;
  confidence: number;
  rawResponseR2Key: string | null;
}

export async function findAiReportByComparison(
  db: D1Database,
  comparisonId: string
): Promise<AiReportRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_aiReports WHERE comparisonId = ?")
    .bind(comparisonId)
    .first<AiReportRow>();
  return result ?? null;
}

export async function upsertAiReport(
  db: D1Database,
  input: UpsertAiReportInput
): Promise<AiReportRow> {
  await db
    .prepare(
      `INSERT INTO sh_aiReports (id, comparisonId, userId, model, provider, promptVersion, reportJson, confidence, rawResponseR2Key, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(comparisonId) DO UPDATE SET
         model = excluded.model,
         provider = excluded.provider,
         promptVersion = excluded.promptVersion,
         reportJson = excluded.reportJson,
         confidence = excluded.confidence,
         rawResponseR2Key = excluded.rawResponseR2Key`
    )
    .bind(
      input.id,
      input.comparisonId,
      input.userId,
      input.model,
      input.provider,
      input.promptVersion,
      JSON.stringify(input.report),
      input.confidence,
      input.rawResponseR2Key,
      new Date().toISOString()
    )
    .run();
  const result = await findAiReportByComparison(db, input.comparisonId);
  if (!result) {
    throw new Error("Failed to upsert AI report");
  }
  return result;
}
