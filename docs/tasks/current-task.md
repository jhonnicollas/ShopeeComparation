# TASK-070: Setup Mastra workflow skeleton

## Status

TODO

## Goal

Create the Mastra workflow skeleton in packages/ai with workflow orchestration for compare-links and keyword-search modes.

## Required Reading

- `docs/ai/mastra-orchestrator.md`
- `docs/architecture/folder-structure.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create packages/ai package.
- Define workflow steps: resolveUrl, extractProduct, score, generateReport.
- Create simple workflow runner (can be replaced with full Mastra later).
- Add unit tests for workflow orchestration.

## Out of Scope

- Do not implement real Mastra dependency (later).
- Do not implement individual agents (TASK-072-074).

## Allowed Files

- `packages/ai/package.json`
- `packages/ai/tsconfig.json`
- `packages/ai/src/workflows/compareLinks.ts`
- `packages/ai/src/workflows/compareLinks.test.ts`
- `packages/ai/src/index.ts`
- `docs/tasks/**`

## Input Contract

QueueMessage and DB context.

## Output Contract

Workflow execution with step results.

## Acceptance Criteria

- [ ] packages/ai exists
- [ ] Workflow skeleton implemented
- [ ] Can chain steps
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
