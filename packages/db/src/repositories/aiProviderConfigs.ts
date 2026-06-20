import type { AiProviderConfigRow } from "@shopee-research/shared";

export interface CreateAiProviderConfigInput {
  id: string;
  providerKey: string;
  displayName: string;
  baseUrl: string;
  authType: string;
  secretRef: string | null;
  timeoutMs: number;
  retryCount: number;
  isEnabled: number;
}

export async function findAiProviderByKey(
  db: D1Database,
  providerKey: string
): Promise<AiProviderConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_aiProviderConfigs WHERE providerKey = ?")
    .bind(providerKey)
    .first<AiProviderConfigRow>();
  return result ?? null;
}

export async function findAiProviderById(
  db: D1Database,
  id: string
): Promise<AiProviderConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_aiProviderConfigs WHERE id = ?")
    .bind(id)
    .first<AiProviderConfigRow>();
  return result ?? null;
}

export async function listAiProviders(
  db: D1Database
): Promise<AiProviderConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_aiProviderConfigs ORDER BY providerKey")
    .all<AiProviderConfigRow>();
  return result.results ?? [];
}

export async function listEnabledAiProviders(
  db: D1Database
): Promise<AiProviderConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_aiProviderConfigs WHERE isEnabled = 1 ORDER BY providerKey")
    .all<AiProviderConfigRow>();
  return result.results ?? [];
}

export async function createAiProvider(
  db: D1Database,
  input: CreateAiProviderConfigInput
): Promise<AiProviderConfigRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_aiProviderConfigs (id, providerKey, displayName, baseUrl, authType, secretRef, timeoutMs, retryCount, isEnabled, lastTestStatus, lastTestAt, lastTestMessage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`
    )
    .bind(
      input.id,
      input.providerKey,
      input.displayName,
      input.baseUrl,
      input.authType,
      input.secretRef,
      input.timeoutMs,
      input.retryCount,
      input.isEnabled,
      now,
      now
    )
    .run();
  const result = await findAiProviderById(db, input.id);
  if (!result) {
    throw new Error("Failed to create AI provider config");
  }
  return result;
}

export async function updateAiProvider(
  db: D1Database,
  id: string,
  updates: Partial<CreateAiProviderConfigInput> & {
    lastTestStatus?: string | null;
    lastTestAt?: string | null;
    lastTestMessage?: string | null;
  }
): Promise<AiProviderConfigRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const allowedKeys: (keyof CreateAiProviderConfigInput)[] = [
    "displayName",
    "baseUrl",
    "authType",
    "secretRef",
    "timeoutMs",
    "retryCount",
    "isEnabled",
  ];
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (updates.lastTestStatus !== undefined) {
    fields.push("lastTestStatus = ?");
    values.push(updates.lastTestStatus);
  }
  if (updates.lastTestAt !== undefined) {
    fields.push("lastTestAt = ?");
    values.push(updates.lastTestAt);
  }
  if (updates.lastTestMessage !== undefined) {
    fields.push("lastTestMessage = ?");
    values.push(updates.lastTestMessage);
  }
  if (fields.length === 0) {
    return findAiProviderById(db, id);
  }
  fields.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db
    .prepare(`UPDATE sh_aiProviderConfigs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return findAiProviderById(db, id);
}

export async function deleteAiProvider(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM sh_aiProviderConfigs WHERE id = ?").bind(id).run();
}
