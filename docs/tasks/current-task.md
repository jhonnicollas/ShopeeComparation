# TASK-044: Build search provider config CRUD API

## Status

DONE

## Goal

Implement REST API endpoints for CRUD operations on sh_searchProviderConfigs table.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_searchProviderConfigs)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md` (searchProviderType)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`

## Scope

- Add search provider Zod schemas.
- Add search provider endpoints to config router.
- GET/POST/PUT/DELETE /api/config/search-providers.
- Admin only for write ops.
- Add unit tests.

## Out of Scope

- Do not create scoring CRUD (TASK-045).
- Do not create frontend (TASK-046).

## Allowed Files

- `packages/shared/src/schemas/config.ts`
- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/config.test.ts`
- `docs/tasks/**`

## Input Contract

Admin HTTP requests to /api/config/search-providers endpoints.

## Output Contract

Standard JSON responses with search provider data.

## Acceptance Criteria

- [ ] Search provider schemas exist
- [ ] GET/POST/PUT/DELETE endpoints implemented
- [ ] All inputs validated
- [ ] Admin only for write ops
- [ ] Unit tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit tests for all CRUD operations
- [ ] Existing tests still pass

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
