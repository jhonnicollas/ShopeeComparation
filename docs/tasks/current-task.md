# TASK-045: Build scoring config CRUD API

## Status

DONE

## Goal

Implement REST API endpoints for CRUD operations on sh_scoringConfigs table.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_scoringConfigs)
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add scoring Zod schemas.
- Add scoring endpoints to config router.
- GET/POST/PUT/DELETE /api/config/scoring-configs.
- Admin only for write ops.
- Add unit tests.

## Out of Scope

- Do not create frontend (TASK-046).

## Allowed Files

- `packages/shared/src/schemas/config.ts`
- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/config.test.ts`
- `docs/tasks/**`

## Input Contract

Admin HTTP requests to /api/config/scoring-configs.

## Output Contract

Standard JSON responses with scoring config data.

## Acceptance Criteria

- [ ] Scoring schemas exist
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
