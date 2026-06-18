# TASK-066: Build red flag UI

## Status

TODO

## Goal

Add red flag UI component that displays risks from RiskItem[] in a visually distinct manner.

## Required Reading

- `docs/shared/enums.md` (riskSeverity)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create RedFlagList component.
- Display severity badges (HIGH/MEDIUM/LOW) with colors.
- Show risk messages grouped by severity.
- Add component test.

## Out of Scope

- Do not change risk detection logic.

## Allowed Files

- `apps/web/src/components/RedFlagList.tsx`
- `apps/web/src/components/RedFlagList.test.tsx`
- `docs/tasks/**`

## Input Contract

RiskItem[].

## Output Contract

Visual list of risks with severity indicators.

## Acceptance Criteria

- [ ] RedFlagList exists
- [ ] Severity color coding
- [ ] Grouped by severity
- [ ] Component tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
