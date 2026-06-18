# TASK-040: Build configuration database tables

## Status

DONE

## Goal

Create repository/CRUD layer for all configuration database tables: sh_appConfigs, sh_aiProviderConfigs, sh_aiModelConfigs, sh_searchProviderConfigs, sh_scoringConfigs. The DDL tables already exist from TASK-021; this task adds the data access layer.

## Required Reading

- `docs/database/schema.md` (config tables)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md` (config categories, value types, auth types)
- `docs/architecture/folder-structure.md` (db/repositories)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create packages/db/src/repositories/appConfigs.ts with CRUD operations.
- Create packages/db/src/repositories/aiProviderConfigs.ts with CRUD operations.
- Create packages/db/src/repositories/aiModelConfigs.ts with CRUD operations.
- Create packages/db/src/repositories/searchProviderConfigs.ts with CRUD operations.
- Create packages/db/src/repositories/scoringConfigs.ts with CRUD operations.
- Add unit tests for each repository using mock D1.
- Re-export all from packages/db/src/index.ts.

## Out of Scope

- Do not create API endpoints (TASK-041 through TASK-045).
- Do not create frontend CRUD pages (TASK-046).
- Do not create seed data (later task).
- Do not create DDL migrations (already done in TASK-021).

## Allowed Files

- `packages/db/src/repositories/appConfigs.ts`
- `packages/db/src/repositories/aiProviderConfigs.ts`
- `packages/db/src/repositories/aiModelConfigs.ts`
- `packages/db/src/repositories/searchProviderConfigs.ts`
- `packages/db/src/repositories/scoringConfigs.ts`
- `packages/db/src/repositories/*.test.ts`
- `packages/db/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `workers/**`
- `apps/web/**`
- `packages/db/migrations/**`
- `.ai/**`

## Input Contract

D1 database has config tables (sh_appConfigs, sh_aiProviderConfigs, sh_aiModelConfigs, sh_searchProviderConfigs, sh_scoringConfigs). Repository functions accept D1Database and row data.

## Output Contract

Repository functions provide CRUD operations for each config table. All functions return parsed row objects or null.

## Acceptance Criteria

- [x] packages/db/src/repositories/appConfigs.ts exists
- [x] packages/db/src/repositories/aiProviderConfigs.ts exists
- [x] packages/db/src/repositories/aiModelConfigs.ts exists
- [x] packages/db/src/repositories/searchProviderConfigs.ts exists
- [x] packages/db/src/repositories/scoringConfigs.ts exists
- [x] Each repository has find/list/create/update/delete operations
- [x] Unit tests pass for all repositories
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for create and find operations
- [x] Unit test for list and update operations
- [x] Unit test for delete operations
- [x] Existing tests still pass

## Documentation Update

- [x] Update task status files only

## Stop Conditions Check

- [x] No hard stop condition is triggered

## Completion Rule

Task is complete only when:

- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes.
- Self-review passes.
- Task is committed.
