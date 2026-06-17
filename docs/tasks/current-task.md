# TASK-013: Setup shared TypeScript types

## Status

DONE

## Goal

Create the `packages/shared` package scaffold with all canonical TypeScript types that map to the enums, database schema, API contracts, and domain entities defined in the source-of-truth docs.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/api/api-contract.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/shared` package with `package.json`, `tsconfig.json`, and `src/` structure.
- Create type definitions matching all enums in `docs/shared/enums.md`.
- Create type definitions matching all database table rows in `docs/database/schema.md`.
- Create type definitions matching all API request/response shapes in `docs/api/api-contract.md`.
- Create domain types for Shopee extraction adapters from `docs/shopee/extraction-strategy.md` and `docs/shopee/search-api-strategy.md`.
- Create a Worker environment type that other workers can import.
- Export all types from a barrel `index.ts`.
- Add unit tests verifying type structure and enum constant coverage.
- Remove `packages/.gitkeep` once the package directory has real files.

## Out of Scope

- Do not create Zod schemas (TASK-014).
- Do not create business logic or services.
- Do not create D1 migrations or repositories.
- Do not create runtime configuration or environment validation.
- Do not modify `apps/web` or `workers/api` beyond type imports if needed.

## Allowed Files

- `packages/shared/**`
- `packages/.gitkeep` (may be removed)
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `workers/api/src/**`
- `workers/api/wrangler.toml`
- `docs/database/schema.md`
- `docs/api/api-contract.md`
- `.ai/**`

## Input Contract

The pnpm workspace exists and includes `packages/*`. Root scripts `lint`, `typecheck`, `test`, `build` exist.

## Output Contract

`packages/shared` is a buildable TypeScript package that exports all canonical types and enums. Other packages and workers can import from `@shopee-research/shared`.

## Acceptance Criteria

- [x] `packages/shared/package.json` exists with `build`, `typecheck`, `lint`, `test` scripts.
- [x] `packages/shared/tsconfig.json` extends root base config.
- [x] All enum types from `docs/shared/enums.md` are defined as TypeScript const objects and string literal unions.
- [x] All database row types from `docs/database/schema.md` are defined as TypeScript interfaces.
- [x] All API request/response types from `docs/api/api-contract.md` are defined.
- [x] Shopee adapter types (`ResolveUrlResult`, `ProductSnapshot`, `ShopSnapshot`, `SearchProvider`, `SearchInput`, `SearchResultCandidate`) are defined.
- [x] Worker environment type `ApiEnv` is exported.
- [x] Barrel `src/index.ts` re-exports everything.
- [x] Unit tests exist covering enum values match the source-of-truth docs.
- [x] `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass.
- [x] `node scripts/quality-gate.js` passes.

## Test Requirements

- [x] Unit tests for enum constant values matching docs/shared/enums.md.
- [x] Type-level compile-time correctness verified by typecheck.

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
