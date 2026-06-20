import type { ScoringConfigRow } from "@shopee-research/shared";

export interface CreateScoringConfigInput {
  id: string;
  configKey: string;
  displayName: string;
  category: string;
  weightsJson: string;
  isDefault: number;
  isEnabled: number;
}

export async function findScoringConfigByKey(
  db: D1Database,
  configKey: string
): Promise<ScoringConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_scoringConfigs WHERE configKey = ?")
    .bind(configKey)
    .first<ScoringConfigRow>();
  return result ?? null;
}

export async function findScoringConfigById(
  db: D1Database,
  id: string
): Promise<ScoringConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_scoringConfigs WHERE id = ?")
    .bind(id)
    .first<ScoringConfigRow>();
  return result ?? null;
}

export async function listScoringConfigs(
  db: D1Database
): Promise<ScoringConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_scoringConfigs ORDER BY category, configKey")
    .all<ScoringConfigRow>();
  return result.results ?? [];
}

export async function listEnabledScoringConfigs(
  db: D1Database
): Promise<ScoringConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_scoringConfigs WHERE isEnabled = 1 ORDER BY category, configKey")
    .all<ScoringConfigRow>();
  return result.results ?? [];
}

export async function findDefaultScoringConfig(
  db: D1Database
): Promise<ScoringConfigRow | null> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_scoringConfigs WHERE isDefault = 1 AND isEnabled = 1 LIMIT 1"
    )
    .first<ScoringConfigRow>();
  return result ?? null;
}

export async function createScoringConfig(
  db: D1Database,
  input: CreateScoringConfigInput
): Promise<ScoringConfigRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_scoringConfigs (id, configKey, displayName, category, weightsJson, isDefault, isEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.configKey,
      input.displayName,
      input.category,
      input.weightsJson,
      input.isDefault,
      input.isEnabled,
      now,
      now
    )
    .run();
  const result = await findScoringConfigById(db, input.id);
  if (!result) {
    throw new Error("Failed to create scoring config");
  }
  return result;
}

export async function updateScoringConfig(
  db: D1Database,
  id: string,
  updates: Partial<CreateScoringConfigInput>
): Promise<ScoringConfigRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const allowedKeys: (keyof CreateScoringConfigInput)[] = [
    "displayName",
    "category",
    "weightsJson",
    "isDefault",
    "isEnabled",
  ];
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (fields.length === 0) {
    return findScoringConfigById(db, id);
  }
  fields.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db
    .prepare(`UPDATE sh_scoringConfigs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return findScoringConfigById(db, id);
}

export async function deleteScoringConfig(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare("DELETE FROM sh_scoringConfigs WHERE id = ?").bind(id).run();
}
