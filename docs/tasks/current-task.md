# TASK-065: Build result page

## Status

DONE

## Goal

Create the frontend result page that displays comparison results with scores, pros, cons, and rankings.

## Required Reading

- `docs/api/api-contract.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create ResultPage component.
- Fetch session and comparison data.
- Display ranked products with scores.
- Show pros/cons for each item.
- Add /results/$researchSessionId route.
- Add component tests.

## Out of Scope

- Do not implement red flag UI (TASK-066).

## Allowed Files

- `apps/web/src/pages/ResultPage.tsx`
- `apps/web/src/pages/ResultPage.test.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/styles/global.css`
- `packages/db/src/repositories/comparisons.ts`
- `workers/api/src/routes/research.ts`
- `docs/tasks/**`

## Input Contract

Research session ID from URL params.

## Output Contract

Page shows ranked comparison items with scores.

## Acceptance Criteria

- [ ] ResultPage created
- [ ] Route added
- [ ] Comparison endpoint created
- [ ] Comparison repository created
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
