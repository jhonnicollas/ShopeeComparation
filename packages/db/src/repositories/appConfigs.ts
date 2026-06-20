import type { AppConfigRow } from "@shopee-research/shared";

export interface CreateAppConfigInput {
  id: string;
  key: string;
  value: string | null;
  valueType: string;
  category: string;
  description: string | null;
  isPublic: number;
  isEnabled: number;
}

export async function findAppConfigByKey(
  db: D1Database,
  key: string
): Promise<AppConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs WHERE key = ?")
    .bind(key)
    .first<AppConfigRow>();
  return result ?? null;
}

export async function listAppConfigs(db: D1Database): Promise<AppConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs ORDER BY category, key")
    .all<AppConfigRow>();
  return result.results ?? [];
}

export async function listAppConfigsByCategory(
  db: D1Database,
  category: string
): Promise<AppConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs WHERE category = ? ORDER BY key")
    .bind(category)
    .all<AppConfigRow>();
  return result.results ?? [];
}

export async function listPublicAppConfigs(
  db: D1Database
): Promise<AppConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs WHERE isPublic = 1 AND isEnabled = 1 ORDER BY key")
    .all<AppConfigRow>();
  return result.results ?? [];
}

export async function createAppConfig(
  db: D1Database,
  input: CreateAppConfigInput
): Promise<AppConfigRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_appConfigs (id, key, value, valueType, category, description, isPublic, isEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.key,
      input.value,
      input.valueType,
      input.category,
      input.description,
      input.isPublic,
      input.isEnabled,
      now,
      now
    )
    .run();
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs WHERE id = ?")
    .bind(input.id)
    .first<AppConfigRow>();
  if (!result) {
    throw new Error("Failed to create app config");
  }
  return result;
}

export async function updateAppConfig(
  db: D1Database,
  id: string,
  updates: Partial<CreateAppConfigInput>
): Promise<AppConfigRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (updates.value !== undefined) {
    fields.push("value = ?");
    values.push(updates.value);
  }
  if (updates.valueType !== undefined) {
    fields.push("valueType = ?");
    values.push(updates.valueType);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.isPublic !== undefined) {
    fields.push("isPublic = ?");
    values.push(updates.isPublic);
  }
  if (updates.isEnabled !== undefined) {
    fields.push("isEnabled = ?");
    values.push(updates.isEnabled);
  }
  if (fields.length === 0) {
    return findAppConfigById(db, id);
  }
  fields.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db
    .prepare(`UPDATE sh_appConfigs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return findAppConfigById(db, id);
}

export async function findAppConfigById(
  db: D1Database,
  id: string
): Promise<AppConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_appConfigs WHERE id = ?")
    .bind(id)
    .first<AppConfigRow>();
  return result ?? null;
}

export async function deleteAppConfig(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM sh_appConfigs WHERE id = ?").bind(id).run();
}
