# TASK-043: Build AI model config CRUD API

## Status

DONE

## Goal

Implement REST API endpoints for CRUD operations on sh_aiModelConfigs table: GET/POST/PUT/DELETE /api/config/ai-models.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_aiModelConfigs)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md` (aiUsageType)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add AI model Zod schemas to packages/shared/src/schemas/config.ts.
- Add AI model endpoints to workers/api/src/routes/config.ts.
- Implement GET /api/config/ai-models (admin only, supports ?providerKey= filter).
- Implement POST /api/config/ai-models (admin only, create).
- Implement PUT /api/config/ai-models/:id (admin only, update).
- Implement DELETE /api/config/ai-models/:id (admin only, delete).
- Validate inputs with Zod.
- Add unit tests for all endpoints.

## Out of Scope

- Do not create search provider CRUD (TASK-044).
- Do not create scoring CRUD (TASK-045).
- Do not create 9router test endpoint (TASK-047).

## Allowed Files

- `packages/shared/src/schemas/config.ts`
- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/config.test.ts`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/db/**` (repositories done)
- `.ai/**`

## Input Contract

Authenticated admin makes HTTP requests to /api/config/ai-models endpoints.

## Output Contract

Standard JSON responses with model data.

## Acceptance Criteria

- [x] AI model schemas exist in shared package
- [x] GET /api/config/ai-models returns list
- [x] GET /api/config/ai-models supports ?providerKey= filter
- [x] POST /api/config/ai-models creates new model
- [x] PUT /api/config/ai-models/:id updates model
- [x] DELETE /api/config/ai-models/:id deletes model
- [x] All inputs validated with Zod
- [x] Only admin can access these endpoints
- [x] Unit tests pass for all endpoints
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for list models
- [x] Unit test for filter by provider
- [x] Unit test for create model
- [x] Unit test for update model
- [x] Unit test for delete model
- [x] Unit test for non-admin denied
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
