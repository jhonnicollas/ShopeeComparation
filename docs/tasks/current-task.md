# TASK-053: Create ShopSnapshot contract

## Status

DONE

## Goal

Verify ShopSnapshot contract and add helper functions for shop trust evaluation.

## Required Reading

- `docs/database/schema.md` (sh_shops)
- `docs/shopee/extraction-strategy.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Verify ShopSnapshot type.
- Add isValidShopSnapshot type guard.
- Add getShopTrustLevel helper.

## Out of Scope

- Do not modify shared types.

## Allowed Files

- `packages/shopee/src/contracts/shops.ts`
- `packages/shopee/src/contracts/shops.test.ts`
- `packages/shopee/src/contracts/index.ts`
- `docs/tasks/**`

## Input Contract

ShopSnapshot type exists in shared.

## Output Contract

Contract helpers exported from packages/shopee.

## Acceptance Criteria

- [ ] Shop contract exists
- [ ] Helpers implemented
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
