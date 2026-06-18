# TASK-057: Build job creation and polling

## Status

DONE

## Goal

Add GET /api/research/jobs/:id endpoint to poll job status, and GET /api/research/sessions/:id to get research session details.

## Required Reading

- `docs/api/api-contract.md`
- `docs/database/schema.md` (sh_jobs, sh_researchSessions)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add GET /api/research/jobs/:id endpoint.
- Add GET /api/research/sessions/:id endpoint.
- Validate ownership (user can only see their own).
- Return current status.
- Add unit tests.

## Out of Scope

- Do not create keyword search endpoint.
- Do not implement job processing (queue consumer).

## Allowed Files

- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/research.test.ts`
- `docs/tasks/**`

## Input Contract

Authenticated user GETs endpoint with jobId or sessionId.

## Output Contract

Returns job/session data with status.

## Acceptance Criteria

- [ ] GET /api/research/jobs/:id implemented
- [ ] GET /api/research/sessions/:id implemented
- [ ] Ownership validation
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
