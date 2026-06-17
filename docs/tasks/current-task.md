# TASK-010: Setup pnpm workspace

## Status

DONE

## Goal

Create the root pnpm monorepo foundation required by all later tasks, including workspace package discovery, strict TypeScript baseline, lint/test/build scripts, and placeholder workspace folders.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/shared/enums.md`
- `docs/database/naming-rules.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add root `package.json`.
- Add `pnpm-workspace.yaml`.
- Add root TypeScript, ESLint, Prettier, and Vitest configuration.
- Add root `.gitignore` for dependency, build, coverage, and Cloudflare generated files.
- Add placeholder workspace directories for `apps`, `workers`, and `packages`.
- Ensure root scripts exist: `lint`, `typecheck`, `test`, and `build`.
- Ensure quality gate can run after the root package exists.
- Update local validation scripts only as needed for ESM-compatible root package execution.

## Out of Scope

- Do not create React/Vite app implementation.
- Do not create Cloudflare Worker implementation.
- Do not add D1 migrations.
- Do not implement product features, auth, Shopee extraction, AI, queue, or UI.

## Allowed Files

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `tsconfig.base.json`
- `eslint.config.js`
- `prettier.config.js`
- `vitest.config.ts`
- `.gitignore`
- `apps/**`
- `workers/**`
- `packages/**`
- `docs/tasks/**`
- `scripts/quality-gate.js`
- `scripts/validate-db-naming.js`
- `scripts/validate-no-hardcode.js`
- `scripts/validate-source-of-truth.js`

## Forbidden Files

- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `docs/prd/**`
- `docs/architecture/technical-decisions.md`
- `.ai/**`
- `scripts/**`

## Input Contract

The repository may start without any application scaffold or root package file.

## Output Contract

The repository has a pnpm workspace root with standard scripts and placeholder workspace folders ready for later tasks.

## Acceptance Criteria

- [x] `package.json` exists with `lint`, `typecheck`, `test`, and `build` scripts.
- [x] `pnpm-workspace.yaml` includes `apps/*`, `workers/*`, and `packages/*`.
- [x] TypeScript strict mode is configured.
- [x] ESLint, Prettier, and Vitest configs exist.
- [x] `.gitignore` excludes dependency, build, coverage, and Cloudflare generated files.
- [x] Placeholder workspace folders exist without implementing feature behavior.
- [x] Validation scripts run under the ESM root package configuration.
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
