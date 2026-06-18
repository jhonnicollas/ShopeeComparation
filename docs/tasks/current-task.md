# TASK-052: Create ProductSnapshot contract

## Status

DONE

## Goal

Verify and ensure ProductSnapshot contract exists in shared package, documenting the shape used by Shopee extractors.

## Required Reading

- `docs/database/schema.md` (sh_products)
- `docs/shopee/extraction-strategy.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Verify ProductSnapshot interface in packages/shared exists.
- Re-export from packages/shopee.
- Add contract documentation.

## Out of Scope

- Do not modify shared type definitions (already correct).

## Allowed Files

- `packages/shopee/src/contracts/products.ts` (new re-export)
- `packages/shopee/src/contracts/index.ts`
- `docs/tasks/**`

## Input Contract

ProductSnapshot type exists in packages/shared/src/types/shopee.ts.

## Output Contract

packages/shopee re-exports ProductSnapshot and provides helper type guards.

## Acceptance Criteria

- [ ] Contract module exists
- [ ] Re-exports ProductSnapshot
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
