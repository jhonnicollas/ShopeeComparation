# TASK-015: Setup lint, typecheck, test, and build scripts

## Status

DONE

## Goal

Ensure all workspace packages have complete and consistent lint, typecheck, test, and build scripts, plus testing libraries (Testing Library for frontend) and format scripts per implementation-stack.md.

## Required Reading

- `docs/architecture/implementation-stack.md`
- `docs/standards/coding-standard.md`
- `docs/standards/testing-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add `@testing-library/react` and `@testing-library/jest-dom` to `apps/web` devDependencies.
- Add `jsdom` Vitest environment support for frontend component tests.
- Add a `format:fix` script to root `package.json` alongside existing `format` check.
- Ensure all four root scripts (`lint`, `typecheck`, `test`, `build`) work correctly across the workspace.
- Add a minimal component smoke test in `apps/web` to verify testing library setup.
- Verify all root scripts pass.

## Out of Scope

- Do not create feature-specific tests.
- Do not modify source-of-truth docs other than task files.
- Do not add business logic.
- Do not change ESLint or Prettier configuration fundamentals.

## Allowed Files

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/src/**/*.test.{ts,tsx}`
- `package.json`
- `vitest.config.ts`
- `docs/tasks/**`

## Forbidden Files

- `workers/api/src/**`
- `workers/api/wrangler.toml`
- `packages/shared/src/**/*.ts` (except test files if needed)
- `docs/api/api-contract.md`
- `.ai/**`

## Input Contract

All workspace packages have `lint`, `typecheck`, `test`, `build` scripts. Quality gate passes.

## Output Contract

Root and workspace scripts are complete and consistent. Frontend component tests can use Testing Library with jsdom environment. A format:fix script exists.

## Acceptance Criteria

- [x] `@testing-library/react` and `@testing-library/jest-dom` are devDependencies of `apps/web`.
- [x] `apps/web` has a Vitest config that supports jsdom environment for component tests.
- [x] Root `package.json` has `format:fix` script.
- [x] A minimal component smoke test exists in `apps/web`.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass.
- [x] `node scripts/quality-gate.js` passes.

## Test Requirements

- [x] Component smoke test runs and passes.
- [x] Existing enum and schema tests still pass.

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
