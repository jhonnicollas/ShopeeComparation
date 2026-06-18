export interface CreateRawSnapshotInput {
  id: string;
  ownerType: string;
  ownerId: string;
  r2Key: string;
  contentType: string | null;
  sizeBytes: number | null;
}

export interface RawSnapshotRow {
  id: string;
  ownerType: string;
  ownerId: string;
  r2Key: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export async function createRawSnapshot(
  db: D1Database,
  input: CreateRawSnapshotInput
): Promise<RawSnapshotRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO sh_rawSnapshots (id, ownerType, ownerId, r2Key, contentType, sizeBytes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      input.id,
      input.ownerType,
      input.ownerId,
      input.r2Key,
      input.contentType,
      input.sizeBytes,
      now
    )
    .run();
  return { ...input, createdAt: now };
}

export async function findRawSnapshotsByOwner(
  db: D1Database,
  ownerType: string,
  ownerId: string
): Promise<RawSnapshotRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_rawSnapshots WHERE ownerType = ? AND ownerId = ? ORDER BY createdAt DESC"
    )
    .bind(ownerType, ownerId)
    .all<RawSnapshotRow>();
  return result.results ?? [];
}

export async function findRawSnapshotById(
  db: D1Database,
  id: string
): Promise<RawSnapshotRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_rawSnapshots WHERE id = ?")
    .bind(id)
    .first<RawSnapshotRow>();
  return result ?? null;
}

export interface CreateFieldEvidenceInput {
  id: string;
  ownerType: string;
  ownerId: string;
  fieldName: string;
  valueText: string | null;
  source: string | null;
  confidence: number;
  status: "available" | "unavailable" | "partial";
  rawSnapshotR2Key: string | null;
}

export interface FieldEvidenceRow {
  id: string;
  ownerType: string;
  ownerId: string;
  fieldName: string;
  valueText: string | null;
  source: string | null;
  confidence: number;
  status: string;
  rawSnapshotR2Key: string | null;
  createdAt: string;
}

export async function createFieldEvidence(
  db: D1Database,
  input: CreateFieldEvidenceInput
): Promise<FieldEvidenceRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO sh_fieldEvidence (id, ownerType, ownerId, fieldName, valueText, source, confidence, status, rawSnapshotR2Key, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      input.id,
      input.ownerType,
      input.ownerId,
      input.fieldName,
      input.valueText,
      input.source,
      input.confidence,
      input.status,
      input.rawSnapshotR2Key,
      now
    )
    .run();
  return { ...input, status: input.status, createdAt: now };
}

export async function findFieldEvidenceByOwner(
  db: D1Database,
  ownerType: string,
  ownerId: string
): Promise<FieldEvidenceRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_fieldEvidence WHERE ownerType = ? AND ownerId = ? ORDER BY createdAt"
    )
    .bind(ownerType, ownerId)
    .all<FieldEvidenceRow>();
  return result.results ?? [];
}
