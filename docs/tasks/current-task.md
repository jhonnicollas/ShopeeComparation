# TASK-047: Build 9router model test API

## Status

DONE

## Goal

Implement POST /api/config/ai-models/:id/test endpoint that calls 9router API to test a configured model and updates lastTestStatus/lastTestAt/lastTestMessage in the database.

## Required Reading

- `docs/api/api-contract.md`
- `docs/ai/9router-configuration.md`
- `docs/configuration/runtime-configuration.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Create testAiModel endpoint in workers/api/src/routes/config.ts.
- Resolve AI provider and secret from env via secretRef.
- Call 9router with model name to test response.
- Update lastTestStatus/lastTestAt/lastTestMessage in sh_aiModelConfigs.
- Return test result with success/message.
- Add unit tests.

## Out of Scope

- Do not create test console UI (TASK-048).
- Do not create test for AI providers (only models).

## Allowed Files

- `workers/api/src/routes/config.ts`
- `workers/api/src/routes/config.test.ts`
- `docs/tasks/**`

## Input Contract

Admin calls POST /api/config/ai-models/:id/test with optional request body { prompt }.

## Output Contract

Returns { success, status, message, latencyMs }.

## Acceptance Criteria

- [ ] Test endpoint implemented
- [ ] Reads model config from DB
- [ ] Reads provider config and resolves secret
- [ ] Calls 9router API
- [ ] Updates lastTestStatus/lastTestAt/lastTestMessage
- [ ] Admin only
- [ ] Unit tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for successful test
- [ ] Unit test for failed test
- [ ] Unit test for model not found
- [ ] Unit test for non-admin denied

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
