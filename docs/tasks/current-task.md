# TASK-025: Setup environment validation

## Status

DONE

## Goal

Create a Zod-based environment validation helper that validates Cloudflare Worker environment variables at startup. This ensures all required environment variables and bindings are present before the worker starts processing requests.

## Required Reading

- `docs/configuration/env-variables.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shared/src/schemas/env.ts` with Zod schemas for environment variables.
- Create `packages/shared/src/env.ts` with validation function.
- Validate non-secret environment variables from env-variables.md.
- Provide clear error messages for missing/invalid env vars.
- Add unit tests for environment validation.
- Re-export from packages/shared/src/index.ts.

## Out of Scope

- Do not create secret validation (secrets should never be logged or validated in plain text).
- Do not create runtime config validation (D1 config tables, later task).
- Do not modify worker env types (already defined in TASK-013).

## Allowed Files

- `packages/shared/src/schemas/env.ts`
- `packages/shared/src/env.ts`
- `packages/shared/src/env.test.ts`
- `packages/shared/src/schemas/index.ts` (re-export)
- `packages/shared/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `workers/**` (env validation is reusable)
- `apps/web/**`
- `.ai/**`

## Input Contract

Worker environment has non-secret vars (APP_ENV, APP_NAME, etc.) and bindings (DB, LOGS, RESEARCH_QUEUE). Secrets are handled separately.

## Output Contract

`packages/shared/src/env.ts` exports `validateEnv()` function that validates env vars and returns parsed object. Function throws clear error if required vars are missing.

## Acceptance Criteria

- [x] `packages/shared/src/schemas/env.ts` exists
- [x] `packages/shared/src/env.ts` exists
- [x] Exports `validateEnv()` function
- [x] Validates all required non-secret vars from env-variables.md
- [x] Provides clear error messages for missing vars
- [x] Unit tests pass for validation
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for valid env object
- [x] Unit test for missing required vars
- [x] Unit test for invalid APP_ENV value
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
