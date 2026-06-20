export interface ExtractionFailureRow {
  id: string;
  ownerId: string;
  ownerType: string;
  adapter: string;
  url: string | null;
  errorMessage: string;
  metadataJson: string | null;
  createdAt: string;
}

export interface CreateExtractionFailureInput {
  id: string;
  ownerId: string;
  ownerType: string;
  adapter: string;
  url: string | null;
  errorMessage: string;
  metadataJson?: string | null;
}

export async function createExtractionFailure(
  db: D1Database,
  input: CreateExtractionFailureInput
): Promise<ExtractionFailureRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_extractionFailures (id, ownerId, ownerType, adapter, url, errorMessage, metadataJson, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.ownerId,
      input.ownerType,
      input.adapter,
      input.url,
      input.errorMessage,
      input.metadataJson ?? null,
      now
    )
    .run();
  return {
    id: input.id,
    ownerId: input.ownerId,
    ownerType: input.ownerType,
    adapter: input.adapter,
    url: input.url,
    errorMessage: input.errorMessage,
    metadataJson: input.metadataJson ?? null,
    createdAt: now,
  };
}

export async function listExtractionFailures(
  db: D1Database,
  options?: { ownerType?: string; limit?: number }
): Promise<ExtractionFailureRow[]> {
  const limit = options?.limit ?? 50;
  if (options?.ownerType) {
    const result = await db
      .prepare(
        "SELECT * FROM sh_extractionFailures WHERE ownerType = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .bind(options.ownerType, limit)
      .all<ExtractionFailureRow>();
    return result.results ?? [];
  }
  const result = await db
    .prepare("SELECT * FROM sh_extractionFailures ORDER BY createdAt DESC LIMIT ?")
    .bind(limit)
    .all<ExtractionFailureRow>();
  return result.results ?? [];
}

export async function listExtractionFailuresByOwner(
  db: D1Database,
  ownerId: string
): Promise<ExtractionFailureRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_extractionFailures WHERE ownerId = ? ORDER BY createdAt DESC"
    )
    .bind(ownerId)
    .all<ExtractionFailureRow>();
  return result.results ?? [];
}

export async function countExtractionFailures(
  db: D1Database,
  options?: { since?: string }
): Promise<number> {
  if (options?.since) {
    const result = await db
      .prepare(
        "SELECT COUNT(*) as count FROM sh_extractionFailures WHERE createdAt >= ?"
      )
      .bind(options.since)
      .first<{ count: number }>();
    return result?.count ?? 0;
  }
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM sh_extractionFailures")
    .first<{ count: number }>();
  return result?.count ?? 0;
}
