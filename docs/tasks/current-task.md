# TASK-020: Setup wrangler config with existing DB and LOGS bindings

## Status

DONE

## Goal

Verify and complete wrangler.toml configuration for all workers (api, queueConsumer, mastra) with correct bindings to existing D1 database, R2 bucket, and Cloudflare Queues per source-of-truth docs.

## Required Reading

- `docs/configuration/env-variables.md`
- `docs/architecture/cloudflare-architecture.md`
- `docs/architecture/folder-structure.md`
- `docs/architecture/implementation-stack.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Verify `workers/api/wrangler.toml` has correct D1, R2, and queue producer bindings.
- Add non-secret environment variables to `workers/api/wrangler.toml` per env-variables.md.
- Document that secrets must be set via `wrangler secret put` (not committed).
- Ensure account_id, database_id, bucket_name match source-of-truth exactly.
- Ensure compatibility_date is current.
- Do not create queue consumer or mastra workers yet (those are later tasks).

## Out of Scope

- Do not create `workers/queueConsumer` or `workers/mastra` (Phase 2 tasks TASK-023, TASK-024).
- Do not add secret values to wrangler.toml.
- Do not create D1 migrations (TASK-021).
- Do not create R2 helpers (TASK-022).
- Do not deploy workers.

## Allowed Files

- `workers/api/wrangler.toml`
- `docs/tasks/**`

## Forbidden Files

- `workers/queueConsumer/**` (not created yet)
- `workers/mastra/**` (not created yet)
- `packages/**` (except task docs)
- `apps/web/**`
- `.ai/**`

## Input Contract

`workers/api/wrangler.toml` exists with basic D1, R2, and queue producer bindings from TASK-012.

## Output Contract

`workers/api/wrangler.toml` has complete and correct configuration matching source-of-truth env-variables.md with all non-secret vars and binding configs.

## Acceptance Criteria

- [x] `workers/api/wrangler.toml` has correct `account_id = "79dea2845a4b62ea5229c8676dea02c0"`
- [x] `workers/api/wrangler.toml` has correct D1 binding with `database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"`
- [x] `workers/api/wrangler.toml` has correct R2 binding with `bucket_name = "multi-apps-ai-bucket"`
- [x] `workers/api/wrangler.toml` has queue producer binding `RESEARCH_QUEUE`
- [x] `workers/api/wrangler.toml` includes all required non-secret vars from env-variables.md
- [x] No secret values are committed in wrangler.toml
- [x] `compatibility_date` is set to current date or recent
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] No new tests required (config-only task)
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
