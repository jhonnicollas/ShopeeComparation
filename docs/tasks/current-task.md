# TASK-067: Build score breakdown UI

## Status

TODO

## Goal

Create ScoreBreakdown component that displays component scores with reasons and levels.

## Required Reading

- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create ScoreBreakdown component.
- Display each component with score, weight, contribution.
- Show reason text per component.
- Color-code by level (low/medium/high).
- Add component test.

## Out of Scope

- Do not change scoring algorithm.

## Allowed Files

- `apps/web/src/components/ScoreBreakdown.tsx`
- `apps/web/src/components/ScoreBreakdown.test.tsx`
- `docs/tasks/**`

## Input Contract

ScoreBreakdownItem[] from generateScoreBreakdown.

## Output Contract

Visual breakdown of scores.

## Acceptance Criteria

- [ ] ScoreBreakdown exists
- [ ] All components displayed
- [ ] Level color coding
- [ ] Component tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
