# TASK-098: Add partial success handling

## Status

DONE

## Goal

Add partial success handling for compare links flow. When some URLs fail to extract, the job should still complete with status `partialSuccess` and save what was successfully extracted. Failed URLs are logged for diagnostics.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Update queue consumer to handle per-URL extraction failures gracefully
- When some URLs fail, mark job as `partialSuccess` instead of `failed`
- Save successful extractions, log failed URLs
- Return partial results in research session
- Add unit tests for partial success scenarios

## Out of Scope

- Do not create new endpoints
- Do not change D1 schema
- Do not modify authentication

## Allowed Files

- `workers/queueConsumer/**`
- `packages/ai/**`
- `packages/shopee/**`
- `packages/db/**` (read-only, no schema changes)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `packages/core/**` (scoring unchanged)
- `wrangler*.toml` (no config changes)

## Acceptance Criteria

- [ ] Queue consumer handles per-URL failures without crashing
- [ ] Job status set to `partialSuccess` when some URLs fail
- [ ] Successful extractions saved to D1
- [ ] Failed URLs logged in job logs
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for partial success scenario
- [ ] Unit test for all URLs failing
- [ ] Unit test for all URLs succeeding

## Documentation Update

- [ ] No public docs changes needed

## Stop Conditions Check

- [ ] No hard stop condition is triggered

## Completion Rule

Task is complete only when:
- Lint passes
- Typecheck passes
- Tests pass
- Build passes
- Self-review passes
- Task is committed
