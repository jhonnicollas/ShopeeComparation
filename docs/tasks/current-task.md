# TASK-012: Setup Cloudflare Workers API

## Status

DONE

## Goal

Create the `workers/api` Cloudflare Worker scaffold using Hono, existing Cloudflare bindings, TypeScript, and a minimal health endpoint.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/cloudflare-architecture.md`
- `docs/architecture/folder-structure.md`
- `docs/configuration/env-variables.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `workers/api` package.
- Configure Hono Worker entrypoint.
- Add `GET /api/health` endpoint.
- Add Worker environment binding types for `DB`, `LOGS`, and `RESEARCH_QUEUE`.
- Add `workers/api/wrangler.toml` using existing D1 and R2 resources.
- Ensure root quality gate includes API Worker build/typecheck.

## Out of Scope

- Do not implement auth endpoints.
- Do not implement research endpoints.
- Do not add D1 migrations.
- Do not enqueue real jobs.
- Do not deploy to Cloudflare.

## Allowed Files

- `workers/api/**`
- `package.json`
- `pnpm-lock.yaml`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/**`
- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `.ai/**`

## Input Contract

The pnpm workspace exists and includes `workers/*`.

## Output Contract

`workers/api` is a buildable Cloudflare Worker package with a health endpoint and correct bindings.

## Acceptance Criteria

- [x] `workers/api/package.json` exists with `dev`, `build`, `typecheck`, `lint`, and `test` scripts.
- [x] `workers/api/src/index.ts` exports a Worker-compatible default.
- [x] `GET /api/health` returns JSON health data.
- [x] Wrangler config uses D1 binding `DB` and existing database `multi_Ai_db`.
- [x] Wrangler config uses R2 binding `LOGS` and existing bucket `multi-apps-ai-bucket`.
- [x] Queue binding name is `RESEARCH_QUEUE`.
- [x] `node scripts/quality-gate.js` passes.

## Test Requirements

- [x] Run `pnpm install`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Run `pnpm build`.
- [x] Run `node scripts/quality-gate.js`.

## Documentation Update

- [x] Update task status files only.

## Stop Conditions Check

- [x] No hard stop condition is triggered.

## Completion Rule

Task is complete only when:

- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes.
- Self-review passes.
