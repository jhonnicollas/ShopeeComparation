# TASK-022: Setup R2 snapshot helper

## Status

DONE

## Goal

Create an R2 snapshot helper utility for storing and retrieving raw snapshots, AI responses, and large artifacts in the R2 bucket binding LOGS. This helper will be used by extractors and AI workflows to store raw data.

## Required Reading

- `docs/database/schema.md` (rawSnapshots table, rawSnapshotR2Key columns)
- `docs/configuration/env-variables.md` (R2 binding LOGS)
- `docs/architecture/cloudflare-architecture.md`
- `docs/standards/logging-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/db/src/r2.ts` with helper functions for R2 operations.
- Implement `putSnapshot()` function to upload data to R2.
- Implement `getSnapshot()` function to download data from R2.
- Implement `generateR2Key()` function to create unique R2 keys with proper prefixes.
- Add TypeScript types for R2 operations.
- Add unit tests for helper functions.
- Use the LOGS R2 binding from worker environment.

## Out of Scope

- Do not create R2 bucket (already exists).
- Do not create actual upload logic (later task).
- Do not create snapshot metadata storage (uses sh_rawSnapshots table).
- Do not create browser-facing R2 URLs (later task).

## Allowed Files

- `packages/db/src/r2.ts`
- `packages/db/src/r2.test.ts`
- `packages/db/package.json` (add test dep if needed)
- `docs/tasks/**`

## Forbidden Files

- `workers/**` (helpers are reusable)
- `apps/web/**`
- `packages/db/migrations/**`
- `.ai/**`

## Input Contract

R2 bucket `multi-apps-ai-bucket` exists with binding `LOGS`. Worker environment has `env.LOGS` of type `R2Bucket`.

## Output Contract

`packages/db/src/r2.ts` exports helper functions that workers can use to store and retrieve snapshots in R2. Helpers accept R2Bucket and return R2 keys.

## Acceptance Criteria

- [x] `packages/db/src/r2.ts` exists
- [x] Exports `putSnapshot()` function
- [x] Exports `getSnapshot()` function
- [x] Exports `generateR2Key()` function
- [x] Uses LOGS binding type from shared package
- [x] All functions have TypeScript types
- [x] Unit tests pass for helper functions
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for generateR2Key() with different prefixes
- [x] Unit test for putSnapshot() with mock R2 bucket
- [x] Unit test for getSnapshot() with mock R2 bucket
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
