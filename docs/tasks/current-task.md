# TASK-076: Save AI report to D1

## Status

TODO

## Goal

Create repository function to save AI reports to sh_aiReports table in D1.

## Required Reading

- `docs/database/schema.md` (sh_aiReports)
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add upsertAiReport() to packages/db/src/repositories/aiReports.ts.
- Add unit tests.
- Re-export from index.

## Out of Scope

- Do not implement R2 storage (TASK-077).

## Allowed Files

- `packages/db/src/repositories/aiReports.ts`
- `packages/db/src/repositories/aiReports.test.ts`
- `packages/db/src/index.ts` (re-export)
- `docs/tasks/**`

## Input Contract

AiReportStructured + comparisonId + userId.

## Output Contract

Saved AiReportRow with id.

## Acceptance Criteria

- [ ] aiReports.ts exists
- [ ] upsertAiReport implemented
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
