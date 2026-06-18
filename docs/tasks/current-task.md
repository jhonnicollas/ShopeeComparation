# TASK-048: Build 9router model test frontend

## Status

DONE

## Goal

Add a Test button to the AI Models tab in ConfigPage that calls the test endpoint and shows the result.

## Required Reading

- `docs/api/api-contract.md`
- `docs/ai/9router-configuration.md`
- `docs/configuration/runtime-configuration.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add testModel function to apps/web/src/lib/config.ts.
- Add Test button to AI Models tab in ConfigPage.
- Show test result inline.
- Add component tests.

## Out of Scope

- Do not create separate test console page.

## Allowed Files

- `apps/web/src/lib/config.ts`
- `apps/web/src/pages/ConfigPage.tsx`
- `apps/web/src/pages/ConfigPage.test.tsx`
- `docs/tasks/**`

## Input Contract

Admin clicks Test button on an AI model row.

## Output Contract

Test result shown below the row with status, latency, and message.

## Acceptance Criteria

- [ ] testModel function exists
- [ ] Test button exists on AI Models tab
- [ ] Shows test result
- [ ] Component tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Existing tests still pass

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
