# TASK-051: Create Shopee shop fixture data

## Status

DONE

## Goal

Create fixture data for Shopee shops that will be used by the mock extractor.

## Required Reading

- `docs/database/schema.md` (sh_shops)
- `docs/shopee/extraction-strategy.md`
- `docs/shared/enums.md` (shop status)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create shop fixtures with diverse statuses.
- Include trust metrics (rating, response rate).
- Add unit tests.

## Out of Scope

- Do not create real extractor (TASK-054).

## Allowed Files

- `packages/shopee/src/fixtures/shops.ts`
- `packages/shopee/src/fixtures/shops.test.ts`
- `packages/shopee/src/index.ts`
- `docs/tasks/**`

## Input Contract

N/A - static fixture data.

## Output Contract

Export array of sample shop data objects.

## Acceptance Criteria

- [ ] shopFixtures exported
- [ ] Includes 4+ sample shops
- [ ] Unit tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Fixture structure tests
- [ ] Existing tests still pass

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
