export interface ConfigAuditLogRow {
  id: string;
  userId: string;
  configType: string;
  configId: string;
  action: string;
  oldValueJson: string | null;
  newValueJson: string | null;
  createdAt: string;
}

export interface CreateConfigAuditLogInput {
  id: string;
  userId: string;
  configType: string;
  configId: string;
  action: string;
  oldValueJson?: string | null;
  newValueJson?: string | null;
}

export async function createConfigAuditLog(
  db: D1Database,
  input: CreateConfigAuditLogInput
): Promise<ConfigAuditLogRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_configAuditLogs (id, userId, configType, configId, action, oldValueJson, newValueJson, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.userId,
      input.configType,
      input.configId,
      input.action,
      input.oldValueJson ?? null,
      input.newValueJson ?? null,
      now
    )
    .run();
  return {
    id: input.id,
    userId: input.userId,
    configType: input.configType,
    configId: input.configId,
    action: input.action,
    oldValueJson: input.oldValueJson ?? null,
    newValueJson: input.newValueJson ?? null,
    createdAt: now,
  };
}

export async function listConfigAuditLogs(
  db: D1Database,
  options?: { configType?: string; configId?: string; limit?: number }
): Promise<ConfigAuditLogRow[]> {
  const limit = options?.limit ?? 50;
  if (options?.configType && options?.configId) {
    const result = await db
      .prepare(
        "SELECT * FROM sh_configAuditLogs WHERE configType = ? AND configId = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .bind(options.configType, options.configId, limit)
      .all<ConfigAuditLogRow>();
    return result.results ?? [];
  }
  if (options?.configType) {
    const result = await db
      .prepare(
        "SELECT * FROM sh_configAuditLogs WHERE configType = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .bind(options.configType, limit)
      .all<ConfigAuditLogRow>();
    return result.results ?? [];
  }
  const result = await db
    .prepare("SELECT * FROM sh_configAuditLogs ORDER BY createdAt DESC LIMIT ?")
    .bind(limit)
    .all<ConfigAuditLogRow>();
  return result.results ?? [];
}
