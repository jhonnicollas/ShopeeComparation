-- Migration 0002: Add extraction failure logs table
-- All tables use sh_ prefix, all columns use camelCase without underscores

CREATE TABLE IF NOT EXISTS sh_extractionFailures (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "ownerType" TEXT NOT NULL,
  "adapter" TEXT NOT NULL,
  "url" TEXT,
  "errorMessage" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sh_extractionFailures_ownerType ON sh_extractionFailures("ownerType");
CREATE INDEX IF NOT EXISTS idx_sh_extractionFailures_ownerId ON sh_extractionFailures("ownerId");
CREATE INDEX IF NOT EXISTS idx_sh_extractionFailures_createdAt ON sh_extractionFailures("createdAt");
