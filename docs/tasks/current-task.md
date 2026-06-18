# TASK-060: Build deterministic scoring engine

## Status

DONE

## Goal

Create a deterministic scoring engine in packages/core that computes product scores based on rating, reviews, sold count, price, shop trust, response rate, and feature match.

## Required Reading

- `docs/shared/enums.md` (scoring fields)
- `docs/configuration/runtime-configuration.md` (scoring weights)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/core package.
- Implement calculateProductScore() function with deterministic algorithm.
- Support custom weights via ScoringWeights input.
- Add unit tests verifying determinism.

## Out of Scope

- Do not implement risk detection (TASK-062).
- Do not implement comparison ranking (TASK-064).

## Allowed Files

- `packages/core/src/scoring/engine.ts`
- `packages/core/src/scoring/engine.test.ts`
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/core/src/index.ts`
- `docs/tasks/**`

## Input Contract

ProductSnapshot, ShopSnapshot, and ScoringWeights.

## Output Contract

ScoringOutput with breakdown scores.

## Acceptance Criteria

- [ ] packages/core exists
- [ ] calculateProductScore implemented
- [ ] Deterministic (same input = same output)
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
