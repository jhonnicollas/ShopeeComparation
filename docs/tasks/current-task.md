# TASK-123: Add extraction failure logs

## Status

IN_PROGRESS

## Goal

Log extraction failures (when Shopee product/shop extraction fails) to D1 for debugging and monitoring. Include error details, adapter used, URL attempted, and timestamps.

## Required Reading

- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create extraction failure log table in D1 (sh_extractionFailures)
- Create repository function to insert/query failure logs
- Hook into existing extractor error paths to log failures
- Add API endpoint to query failure logs (for admin/debugging)
- Add tests

## Out of Scope

- Do not change frontend
- Do not change extraction logic
- Do not block on failures (fire-and-forget logging)

## Allowed Files

- `packages/db/src/schema.ts` (add table)
- `packages/db/src/repositories/extractionFailures.ts` (new)
- `packages/db/src/repositories/extractionFailures.test.ts` (new)
- `packages/shopee/src/extractors/fallbackExtractor.ts` (hook logging)
- `workers/api/src/routes/research.ts` (add endpoint)
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/core/**`

## Acceptance Criteria

- [x] Extraction failure log table created
- [x] Repository functions to insert/query
- [x] Failures logged on extraction errors
- [x] API endpoint to query failures
- [x] Tests pass
- [x] Quality gate passes

## Completion Rule

Task is complete only when all quality gates pass and task is committed.
