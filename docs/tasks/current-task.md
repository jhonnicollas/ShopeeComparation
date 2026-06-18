# TASK-055: Build compare links API using mock extractor

## Status

DONE

## Goal

Implement POST /api/research/compare-links endpoint that validates auth, creates research session and job, and enqueues queue message for async processing.

## Required Reading

- `docs/api/api-contract.md` (compare-links endpoint)
- `docs/database/schema.md` (sh_researchSessions, sh_jobs)
- `docs/architecture/cloudflare-architecture.md`
- `docs/shared/enums.md` (researchMode, jobType, jobStatus)
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Add research router at workers/api/src/routes/research.ts.
- Implement POST /api/research/compare-links.
- Validate links with compareLinksRequestSchema.
- Create research session in D1.
- Create job in D1.
- Enqueue message via sendResearchJobMessage.
- Return researchSessionId and jobId.
- Add unit tests.

## Out of Scope

- Do not implement keyword search (later).
- Do not implement job polling (TASK-057).
- Do not implement actual extraction logic (queue consumer does it).

## Allowed Files

- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/research.test.ts`
- `workers/api/src/index.ts` (mount router)
- `docs/tasks/**`

## Input Contract

Authenticated user POSTs JSON { links: [...] }.

## Output Contract

Returns { researchSessionId, jobId, status }.

## Acceptance Criteria

- [ ] research router exists
- [ ] POST /api/research/compare-links implemented
- [ ] Validates with Zod schema
- [ ] Creates research session in D1
- [ ] Creates job in D1
- [ ] Enqueues queue message
- [ ] Auth required
- [ ] Unit tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for successful creation
- [ ] Unit test for empty links
- [ ] Unit test for too many links
- [ ] Unit test for unauthenticated

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
