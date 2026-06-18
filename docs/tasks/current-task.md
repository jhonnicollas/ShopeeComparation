# TASK-061: Build score breakdown

## Status

DONE

## Goal

Create a function that generates human-readable score breakdown explanation from ScoringOutput.

## Required Reading

- `docs/shared/enums.md`
- `docs/architecture/folder-structure.md` (core/scoring)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/core/src/scoring/breakdown.ts.
- Implement generateScoreBreakdown() function.
- Return explanation array with component scores and reasons.
- Add unit tests.

## Out of Scope

- Do not change scoring algorithm.
- Do not create UI.

## Allowed Files

- `packages/core/src/scoring/breakdown.ts`
- `packages/core/src/scoring/breakdown.test.ts`
- `packages/core/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

ScoringOutput from shared.

## Output Contract

ScoreBreakdown array with component explanations.

## Acceptance Criteria

- [ ] breakdown.ts exists
- [ ] generateScoreBreakdown implemented
- [ ] Returns per-component explanations
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
