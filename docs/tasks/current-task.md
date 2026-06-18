# TASK-064: Build comparison ranking

## Status

DONE

## Goal

Create a function that takes multiple scored products and returns them ranked by score with tiebreakers.

## Required Reading

- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/core/src/scoring/ranking.ts.
- Implement rankProducts() that sorts by score with tiebreakers.
- Add unit tests.

## Out of Scope

- Do not implement ranking UI.

## Allowed Files

- `packages/core/src/scoring/ranking.ts`
- `packages/core/src/scoring/ranking.test.ts`
- `packages/core/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

Array of ScoredProduct (product + ScoringOutput).

## Output Contract

Array of ScoredProduct sorted by rank ascending.

## Acceptance Criteria

- [ ] ranking.ts exists
- [ ] rankProducts implemented
- [ ] Tiebreakers work (rating, reviews)
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
