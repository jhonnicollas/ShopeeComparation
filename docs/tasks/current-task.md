# TASK-058: Save products, shops, weights, and comparison items to D1

## Status

DONE

## Goal

Create repository functions to save extracted products, shops, weights, features, and comparison items to D1 from the queue consumer.

## Required Reading

- `docs/database/schema.md` (sh_products, sh_shops, sh_productWeights, sh_productFeatures, sh_comparisonItems)
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add upsert functions for products, shops, weights, features.
- Add createComparisonItem function.
- Use prefixed IDs (prd_, shp_, wgt_, fea_, cim_).
- Handle duplicate inserts (UPSERT pattern).
- Add unit tests.

## Out of Scope

- Do not implement actual extraction logic.
- Do not implement scoring calculation.

## Allowed Files

- `packages/db/src/repositories/products.ts`
- `packages/db/src/repositories/shops.ts`
- `packages/db/src/repositories/comparisonItems.ts`
- `packages/db/src/repositories/*.test.ts`
- `packages/db/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

ProductSnapshot, ShopSnapshot, and comparison data from extraction.

## Output Contract

Saved rows in D1, returned with IDs.

## Acceptance Criteria

- [ ] upsertProduct implemented
- [ ] upsertShop implemented
- [ ] saveProductWeight implemented
- [ ] saveProductFeatures implemented
- [ ] createComparisonItem implemented
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
