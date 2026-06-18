# TASK-063: Build data quality checker

## Status

DONE

## Goal

Create a data quality checker that assesses completeness and confidence of extracted product data.

## Required Reading

- `docs/shared/enums.md` (fieldAvailabilityStatus)
- `docs/database/schema.md` (sh_fieldEvidence)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/core/src/quality/checker.ts.
- Implement checkDataQuality() returning DataQualityField[].
- Check fields: priceMin, rating, reviewCount, soldCount, shop, etc.
- Add unit tests.

## Out of Scope

- Do not implement risk detection (TASK-062).

## Allowed Files

- `packages/core/src/quality/checker.ts`
- `packages/core/src/quality/checker.test.ts`
- `packages/core/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

ProductSnapshot and ShopSnapshot.

## Output Contract

DataQualityField[] with fieldName, status, valueText.

## Acceptance Criteria

- [ ] checker.ts exists
- [ ] checkDataQuality implemented
- [ ] Multiple fields checked
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
