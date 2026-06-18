# TASK-062: Build risk detection engine

## Status

DONE

## Goal

Create a risk detection engine that identifies potential risks in product/shop data based on configurable rules.

## Required Reading

- `docs/shared/enums.md` (riskSeverity)
- `docs/database/schema.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/core/src/risk/engine.ts.
- Implement detectRisks() returning RiskItem[].
- Check for: low rating, few reviews, low response rate, suspicious pricing.
- Add unit tests.

## Out of Scope

- Do not implement data quality (TASK-063).

## Allowed Files

- `packages/core/src/risk/engine.ts`
- `packages/core/src/risk/engine.test.ts`
- `packages/core/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

ProductSnapshot and ShopSnapshot.

## Output Contract

RiskItem[] with type, severity, message.

## Acceptance Criteria

- [ ] engine.ts exists
- [ ] detectRisks implemented
- [ ] Multiple risk types checked
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
