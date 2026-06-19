# TASK-100: Build keyword search API

## Status

TODO

## Goal

Build `POST /api/research/keyword-search` endpoint that accepts keyword, optional shippedFrom (default `DKI Jakarta`), limit, price range, minimum rating, and store status filters. Creates a `sh_researchSessions` row, a `sh_jobs` row, and enqueues a `keywordSearch` job via Cloudflare Queues. Returns 202 with researchSessionId, jobId, and status.

## Required Reading

- `docs/prd/prd.md` (sections 8.3, 8.9, 8.10)
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/api/api-contract.md` (section: Research API)
- `docs/configuration/runtime-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add `POST /api/research/keyword-search` endpoint in `workers/api/src/routes/research.ts`
- Validate with existing `keywordSearchRequestSchema` from `packages/shared`
- Reuse `createResearchSession` and `createJob` from `packages/db`
- Reuse `sendResearchJobMessage` from `packages/db` (queue producer)
- Auth via existing `authenticate` helper
- Return 202 with `{ researchSessionId, jobId, status: "pending" }`
- Add unit tests for all scenarios

## Out of Scope

- Do not implement queue consumer logic (existing or separate task)
- Do not implement candidate collection/enrichment/scoring (TASK-101..105)
- Do not build frontend (TASK-106..107)
- Do not change D1 schema
- Do not change wrangler.toml

## Allowed Files

- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/research.test.ts`
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `packages/db/**` (no DB schema changes; reuse existing repos)
- `packages/shopee/**`
- `packages/ai/**`
- `packages/core/**`
- `wrangler*.toml`

## Input Contract

`POST /api/research/keyword-search`
```json
{
  "keyword": "tensimeter digital",
  "shippedFrom": "DKI Jakarta",
  "limit": 10,
  "priceMin": null,
  "priceMax": null,
  "minimumRating": null,
  "storeStatus": null
}
```

## Output Contract

`202 Accepted`
```json
{
  "researchSessionId": "rsr_xxx",
  "jobId": "job_xxx",
  "status": "pending"
}
```

## Acceptance Criteria

- [ ] POST /api/research/keyword-search endpoint exists
- [ ] Auth required (401 if no session)
- [ ] Validates with Zod keywordSearchRequestSchema
- [ ] Returns 400 on invalid input (empty keyword, limit out of range, etc.)
- [ ] Creates research session in D1 (mode=keywordSearch, status=pending, shippedFrom defaults to "DKI Jakarta")
- [ ] Creates job in D1 (type=keywordSearch, status=pending)
- [ ] Enqueues message via sendResearchJobMessage
- [ ] Returns 202 with researchSessionId, jobId, status=pending
- [ ] Unit tests for all scenarios
- [ ] All existing tests pass
- [ ] Quality gate passes (lint, typecheck, test, build, quality-gate.js)

## Test Requirements

- [ ] Unit test: returns 401 without auth
- [ ] Unit test: returns 400 for empty keyword
- [ ] Unit test: returns 400 for limit out of range
- [ ] Unit test: creates session, job, and enqueues message with all fields
- [ ] Unit test: defaults shippedFrom to "DKI Jakarta"
- [ ] Unit test: respects priceMin, priceMax, minimumRating, storeStatus

## Documentation Update

- [ ] No public docs changes needed (internal API)

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
