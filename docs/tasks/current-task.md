# TASK-014: Setup Zod validation schemas

## Status

DONE

## Goal

Create Zod schemas in `packages/shared/src/schemas/` that validate all external input, API request/response shapes, and internal contracts as required by the source-of-truth docs.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/folder-structure.md`
- `docs/shared/enums.md`
- `docs/api/api-contract.md`
- `docs/database/schema.md`
- `docs/shopee/extraction-strategy.md`
- `docs/shopee/search-api-strategy.md`
- `docs/ai/9router-configuration.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add `zod` dependency to `packages/shared`.
- Create Zod schemas for all auth API requests (register, login).
- Create Zod schemas for research API requests (compare-links, keyword-search).
- Create Zod schemas for shopee resolve-url request.
- Create Zod schemas for AI model test request.
- Create Zod schemas for API error response shape.
- Create Zod schemas for Shopee adapter output types (ResolveUrlResult, ProductSnapshot, ShopSnapshot, SearchResultCandidate, WeightExtraction).
- Create Zod schemas for AI report structured output.
- Create Zod schemas for queue message payload.
- Create Zod enum schemas mirroring the const enums in constants/enums.ts.
- Add unit tests verifying schemas parse valid data and reject invalid data.
- Export all schemas from barrel `src/schemas/index.ts` and from `src/index.ts`.

## Out of Scope

- Do not create business logic or services.
- Do not create D1 migrations or repositories.
- Do not create API route handlers.
- Do not modify `apps/web` or `workers/api`.
- Do not create environment validation (that belongs in Phase 2).

## Allowed Files

- `packages/shared/**`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `workers/api/**`
- `docs/api/api-contract.md`
- `.ai/**`

## Input Contract

`packages/shared` exists with types and enums. Zod is not yet a dependency.

## Output Contract

`packages/shared` exports Zod schemas that other packages and workers can use for runtime validation of all external input and structured AI output.

## Acceptance Criteria

- [x] `zod` is a dependency of `packages/shared`.
- [x] Zod enum schemas exist for all enums from `docs/shared/enums.md`.
- [x] Zod request schemas exist for register, login, compare-links, keyword-search, resolve-url, and AI model test.
- [x] Zod schema exists for API error response.
- [x] Zod schemas exist for Shopee adapter output shapes.
- [x] Zod schema exists for AI report structured output.
- [x] Zod schema exists for queue message payload.
- [x] Unit tests verify schemas accept valid data and reject invalid data.
- [x] `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass.
- [x] `node scripts/quality-gate.js` passes.

## Test Requirements

- [x] Unit tests for schema parse success with valid data.
- [x] Unit tests for schema parse failure with invalid data.
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
