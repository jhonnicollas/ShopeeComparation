import type { SearchProviderConfigRow } from "@shopee-research/shared";

export interface CreateSearchProviderConfigInput {
  id: string;
  providerKey: string;
  displayName: string;
  providerType: string;
  priority: number;
  baseUrl: string | null;
  authType: string;
  secretRef: string | null;
  timeoutMs: number;
  retryCount: number;
  isEnabled: number;
}

export async function findSearchProviderByKey(
  db: D1Database,
  providerKey: string
): Promise<SearchProviderConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_searchProviderConfigs WHERE providerKey = ?")
    .bind(providerKey)
    .first<SearchProviderConfigRow>();
  return result ?? null;
}

export async function findSearchProviderById(
  db: D1Database,
  id: string
): Promise<SearchProviderConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_searchProviderConfigs WHERE id = ?")
    .bind(id)
    .first<SearchProviderConfigRow>();
  return result ?? null;
}

export async function listSearchProviders(
  db: D1Database
): Promise<SearchProviderConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_searchProviderConfigs ORDER BY priority, providerKey")
    .all<SearchProviderConfigRow>();
  return result.results ?? [];
}

export async function listEnabledSearchProviders(
  db: D1Database
): Promise<SearchProviderConfigRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_searchProviderConfigs WHERE isEnabled = 1 ORDER BY priority, providerKey"
    )
    .all<SearchProviderConfigRow>();
  return result.results ?? [];
}

export async function createSearchProvider(
  db: D1Database,
  input: CreateSearchProviderConfigInput
): Promise<SearchProviderConfigRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_searchProviderConfigs (id, providerKey, displayName, providerType, priority, baseUrl, authType, secretRef, timeoutMs, retryCount, isEnabled, lastTestStatus, lastTestAt, lastTestMessage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`
    )
    .bind(
      input.id,
      input.providerKey,
      input.displayName,
      input.providerType,
      input.priority,
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
  const result = await findSearchProviderById(db, input.id);
  if (!result) {
    throw new Error("Failed to create search provider config");
  }
  return result;
}

export async function updateSearchProvider(
  db: D1Database,
  id: string,
  updates: Partial<CreateSearchProviderConfigInput> & {
    lastTestStatus?: string | null;
    lastTestAt?: string | null;
    lastTestMessage?: string | null;
  }
): Promise<SearchProviderConfigRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const allowedKeys: (keyof CreateSearchProviderConfigInput)[] = [
    "displayName",
    "providerType",
    "priority",
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
    return findSearchProviderById(db, id);
  }
  fields.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db
    .prepare(`UPDATE sh_searchProviderConfigs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return findSearchProviderById(db, id);
}

export async function deleteSearchProvider(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare("DELETE FROM sh_searchProviderConfigs WHERE id = ?").bind(id).run();
}
