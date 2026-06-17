# TASK-011: Setup React Vite frontend

## Status

DONE

## Goal

Create the `apps/web` React + Vite frontend scaffold required by the source-of-truth docs, including TanStack Router, TanStack Query, basic route shell, and local build/test integration.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/shared/enums.md`
- `docs/ui/configuration-crud.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `apps/web` package.
- Configure Vite React app with strict TypeScript.
- Add TanStack Router and TanStack Query providers.
- Add a minimal route tree with home, compare placeholder, keyword search placeholder, and settings placeholder routes.
- Add frontend CSS baseline without product feature implementation.
- Ensure root quality gate includes the frontend package build.

## Out of Scope

- Do not implement auth flows.
- Do not implement configuration CRUD screens.
- Do not implement Shopee compare/search workflows.
- Do not call backend APIs.
- Do not add Cloudflare Pages deployment config.

## Allowed Files

- `apps/web/**`
- `package.json`
- `pnpm-lock.yaml`
- `docs/tasks/**`

## Forbidden Files

- `workers/**`
- `packages/**`
- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `.ai/**`

## Input Contract

The root pnpm workspace exists and includes `apps/*`.

## Output Contract

`apps/web` is a buildable Vite React package that uses TanStack Router and TanStack Query.

## Acceptance Criteria

- [x] `apps/web/package.json` exists with `dev`, `build`, `preview`, `lint`, `typecheck`, and `test` scripts.
- [x] Vite React entrypoint exists.
- [x] TanStack Router is configured.
- [x] TanStack Query provider is configured.
- [x] Placeholder routes compile without calling backend APIs.
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
