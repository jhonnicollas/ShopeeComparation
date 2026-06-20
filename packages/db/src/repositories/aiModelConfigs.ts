import type { AiModelConfigRow } from "@shopee-research/shared";

export interface CreateAiModelConfigInput {
  id: string;
  providerKey: string;
  modelKey: string;
  modelName: string;
  displayName: string | null;
  usageType: string;
  contextWindow: number | null;
  supportsJson: number;
  supportsTools: number;
  supportsVision: number;
  costInput: number | null;
  costOutput: number | null;
  isDefault: number;
  isEnabled: number;
}

export async function findAiModelById(
  db: D1Database,
  id: string
): Promise<AiModelConfigRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_aiModelConfigs WHERE id = ?")
    .bind(id)
    .first<AiModelConfigRow>();
  return result ?? null;
}

export async function listAiModels(db: D1Database): Promise<AiModelConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_aiModelConfigs ORDER BY providerKey, modelKey")
    .all<AiModelConfigRow>();
  return result.results ?? [];
}

export async function listAiModelsByProvider(
  db: D1Database,
  providerKey: string
): Promise<AiModelConfigRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_aiModelConfigs WHERE providerKey = ? ORDER BY modelKey"
    )
    .bind(providerKey)
    .all<AiModelConfigRow>();
  return result.results ?? [];
}

export async function listEnabledAiModels(
  db: D1Database
): Promise<AiModelConfigRow[]> {
  const result = await db
    .prepare("SELECT * FROM sh_aiModelConfigs WHERE isEnabled = 1 ORDER BY providerKey, modelKey")
    .all<AiModelConfigRow>();
  return result.results ?? [];
}

export async function findDefaultModelByUsageType(
  db: D1Database,
  usageType: string
): Promise<AiModelConfigRow | null> {
  const result = await db
    .prepare(
      "SELECT * FROM sh_aiModelConfigs WHERE usageType = ? AND isDefault = 1 AND isEnabled = 1 LIMIT 1"
    )
    .bind(usageType)
    .first<AiModelConfigRow>();
  return result ?? null;
}

export async function createAiModel(
  db: D1Database,
  input: CreateAiModelConfigInput
): Promise<AiModelConfigRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_aiModelConfigs (id, providerKey, modelKey, modelName, displayName, usageType, contextWindow, supportsJson, supportsTools, supportsVision, costInput, costOutput, isDefault, isEnabled, lastTestStatus, lastTestAt, lastTestMessage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`
    )
    .bind(
      input.id,
      input.providerKey,
      input.modelKey,
      input.modelName,
      input.displayName,
      input.usageType,
      input.contextWindow,
      input.supportsJson,
      input.supportsTools,
      input.supportsVision,
      input.costInput,
      input.costOutput,
      input.isDefault,
      input.isEnabled,
      now,
      now
    )
    .run();
  const result = await findAiModelById(db, input.id);
  if (!result) {
    throw new Error("Failed to create AI model config");
  }
  return result;
}

export async function updateAiModel(
  db: D1Database,
  id: string,
  updates: Partial<CreateAiModelConfigInput> & {
    lastTestStatus?: string | null;
    lastTestAt?: string | null;
    lastTestMessage?: string | null;
  }
): Promise<AiModelConfigRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const allowedKeys: (keyof CreateAiModelConfigInput)[] = [
    "modelName",
    "displayName",
    "usageType",
    "contextWindow",
    "supportsJson",
    "supportsTools",
    "supportsVision",
    "costInput",
    "costOutput",
    "isDefault",
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
    return findAiModelById(db, id);
  }
  fields.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db
    .prepare(`UPDATE sh_aiModelConfigs SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return findAiModelById(db, id);
}

export async function deleteAiModel(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM sh_aiModelConfigs WHERE id = ?").bind(id).run();
}
