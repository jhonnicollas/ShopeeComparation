-- Migration 0003: Add config audit logs table
-- All tables use sh_ prefix, all columns use camelCase without underscores

CREATE TABLE IF NOT EXISTS sh_configAuditLogs (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "configType" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "oldValueJson" TEXT,
  "newValueJson" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sh_configAuditLogs_userId ON sh_configAuditLogs("userId");
CREATE INDEX IF NOT EXISTS idx_sh_configAuditLogs_configType ON sh_configAuditLogs("configType");
CREATE INDEX IF NOT EXISTS idx_sh_configAuditLogs_configId ON sh_configAuditLogs("configId");
CREATE INDEX IF NOT EXISTS idx_sh_configAuditLogs_createdAt ON sh_configAuditLogs("createdAt");
