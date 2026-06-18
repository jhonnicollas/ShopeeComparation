# TASK-072: Build Recommendation Writer Agent

## Status

TODO

## Goal

Create an AI agent that generates product recommendation reports using 9router.

## Required Reading

- `docs/ai/mastra-orchestrator.md`
- `docs/ai/9router-configuration.md`
- `docs/shared/enums.md` (AiReportStructured)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/ai/src/agents/recommendationWriter.ts.
- Build prompt from products and user query.
- Call 9router with jsonMode.
- Parse response to AiReportStructured.
- Add unit tests.

## Out of Scope

- Do not implement Risk Analyzer (TASK-073).

## Allowed Files

- `packages/ai/src/agents/recommendationWriter.ts`
- `packages/ai/src/agents/recommendationWriter.test.ts`
- `packages/ai/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

RecommendationInput with products and user query.

## Output Contract

RecommendationOutput with parsed report.

## Acceptance Criteria

- [ ] Agent file exists
- [ ] Builds prompt correctly
- [ ] Calls 9router via chat helper
- [ ] Parses JSON response
- [ ] Handles invalid JSON gracefully
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
