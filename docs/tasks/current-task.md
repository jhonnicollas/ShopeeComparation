# TASK-041: Build app config CRUD API

## Status

DONE

## Goal

Implement REST API endpoints for CRUD operations on sh_appConfigs table: GET /api/config/apps, POST /api/config/apps, PUT /api/config/apps/:id, DELETE /api/config/apps/:id.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_appConfigs)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md` (configValueType, configCategory)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add config router at workers/api/src/routes/config.ts.
- Implement GET /api/config/apps (list all).
- Implement GET /api/config/apps/public (list public configs).
- Implement POST /api/config/apps (create).
- Implement PUT /api/config/apps/:id (update).
- Implement DELETE /api/config/apps/:id (delete).
- Validate inputs with Zod schemas.
- Require authentication (admin only for write operations).
- Add unit tests for all endpoints.

## Out of Scope

- Do not create AI provider/model CRUD (TASK-042, TASK-043).
- Do not create search provider CRUD (TASK-044).
- Do not create scoring CRUD (TASK-045).
- Do not create frontend CRUD page (TASK-046).

## Allowed Files

- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/config.test.ts`
- `workers/api/src/index.ts` (mount router)
- `packages/shared/src/schemas/config.ts` (new Zod schemas)
- `packages/shared/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/db/**` (repositories done)
- `.ai/**`

## Input Contract

Authenticated admin makes HTTP requests to /api/config/apps endpoints with JSON body.

## Output Contract

Standard JSON responses with config data or standard error format.

## Acceptance Criteria

- [x] workers/api/src/routes/config.ts exists
- [x] GET /api/config/apps returns list
- [x] GET /api/config/apps/public returns public configs only
- [x] POST /api/config/apps creates new config
- [x] PUT /api/config/apps/:id updates config
- [x] DELETE /api/config/apps/:id deletes config
- [x] All inputs validated with Zod
- [x] Write operations require admin role
- [x] Unit tests pass for all endpoints
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for list configs
- [x] Unit test for create config
- [x] Unit test for update config
- [x] Unit test for delete config
- [x] Unit test for authorization (non-admin denied)
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
