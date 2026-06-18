# TASK-042: Build AI provider config CRUD API

## Status

DONE

## Goal

Implement REST API endpoints for CRUD operations on sh_aiProviderConfigs table: GET/POST/PUT/DELETE /api/config/ai-providers.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_aiProviderConfigs)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md` (aiAuthType)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add AI provider Zod schemas to packages/shared/src/schemas/config.ts.
- Add AI provider endpoints to workers/api/src/routes/config.ts.
- Implement GET /api/config/ai-providers (admin only, list all).
- Implement POST /api/config/ai-providers (admin only, create).
- Implement PUT /api/config/ai-providers/:id (admin only, update).
- Implement DELETE /api/config/ai-providers/:id (admin only, delete).
- Validate inputs with Zod.
- Add unit tests for all endpoints.

## Out of Scope

- Do not create AI model CRUD (TASK-043).
- Do not create search provider CRUD (TASK-044).
- Do not create scoring CRUD (TASK-045).
- Do not expose actual secret values (only secretRef).

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

Authenticated admin makes HTTP requests to /api/config/ai-providers endpoints.

## Output Contract

Standard JSON responses with provider data. Secret values never returned; only secretRef.

## Acceptance Criteria

- [x] AI provider schemas exist in shared package
- [x] GET /api/config/ai-providers returns list
- [x] POST /api/config/ai-providers creates new provider
- [x] PUT /api/config/ai-providers/:id updates provider
- [x] DELETE /api/config/ai-providers/:id deletes provider
- [x] All inputs validated with Zod
- [x] Only admin can access these endpoints
- [x] Unit tests pass for all endpoints
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for list providers
- [x] Unit test for create provider
- [x] Unit test for update provider
- [x] Unit test for delete provider
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
