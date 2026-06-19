# TASK-122: Add error handling standardization

## Status

DONE

## Goal

Standardize error response construction across all API routes using shared helpers.

## Required Reading

- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `workers/api/src/lib/errors.ts` with shared error helpers
- Add global `app.onError` handler in `workers/api/src/index.ts`
- Refactor `auth.ts`, `config.ts`, `research.ts`, `shopee.ts` to use shared helpers
- Add tests for error helpers

## Out of Scope

- Do not change frontend
- Do not change non-error logic
- Do not add new error codes

## Allowed Files

- `workers/api/src/lib/errors.ts` (new)
- `workers/api/src/lib/errors.test.ts` (new)
- `workers/api/src/index.ts`
- `workers/api/src/routes/auth.ts`
- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/shopee.ts`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/db/**`
- `packages/shopee/**`
- `packages/core/**`

## Acceptance Criteria

- [x] Shared error helper created
- [x] Global error handler added
- [x] All routes use shared helpers
- [x] Tests pass
- [x] Quality gate passes

## Completion Rule

Task is complete only when all quality gates pass and task is committed.
