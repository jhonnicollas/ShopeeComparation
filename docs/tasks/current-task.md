# TASK-050: Create Shopee product fixture data

## Status

DONE

## Goal

Create fixture data for Shopee products that will be used by the mock extractor for development and testing.

## Required Reading

- `docs/database/schema.md` (sh_products, sh_productWeights, sh_productFeatures)
- `docs/shopee/extraction-strategy.md`
- `docs/shared/enums.md` (product fields)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/shopee package.
- Create fixture data file with sample products.
- Include diverse price ranges, ratings, and feature sets.
- Add unit tests verifying fixture structure.

## Out of Scope

- Do not create shop fixtures (TASK-051).
- Do not create real extractor (TASK-054).
- Do not write fixtures to D1.

## Allowed Files

- `packages/shopee/**`
- `docs/tasks/**`

## Input Contract

N/A - static fixture data.

## Output Contract

Export array of sample product data objects.

## Acceptance Criteria

- [ ] packages/shopee directory exists
- [ ] Fixture data exported
- [ ] Includes 5+ sample products
- [ ] Unit tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Fixture structure tests
- [ ] Existing tests still pass

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
