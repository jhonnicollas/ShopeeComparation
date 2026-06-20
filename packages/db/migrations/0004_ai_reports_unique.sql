-- Migration 0004: Add UNIQUE constraint on sh_aiReports.comparisonId
-- Required for ON CONFLICT(comparisonId) DO UPDATE in upsertAiReport

CREATE UNIQUE INDEX IF NOT EXISTS idx_sh_aiReports_comparisonId_unique ON sh_aiReports("comparisonId");