# TASK-106: Build keyword search frontend page

## Status

TODO

## Goal

Build the Keyword Search frontend page with a form for keyword, optional filters (shippedFrom default "DKI Jakarta", limit default 10, priceMin/Max, minimumRating, storeStatus), and submission to POST /api/research/keyword-search. The page must show job status (polling) and navigate to result page on completion.

## Required Reading

- `docs/prd/prd.md` (section 8.3, 8.10)
- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md` (Research API section)
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/done-definition.md`

## Scope

- Update `apps/web/src/pages/KeywordSearchPage.tsx` with full form
- Add `submitKeywordSearch()` function in `apps/web/src/lib/shopee.ts` (or similar)
- Use TanStack Query mutation to POST
- Use TanStack Query polling for job status (GET /api/research/jobs/:id)
- Navigate to results page on completion
- Show loading and error states
- Add CSS for form
- Add tests

## Out of Scope

- Do not implement result page (TASK-107)
- Do not change D1 schema
- Do not call Shopee from frontend

## Allowed Files

- `apps/web/src/pages/KeywordSearchPage.tsx`
- `apps/web/src/pages/KeywordSearchPage.test.tsx` (new)
- `apps/web/src/lib/research.ts` (new) or `apps/web/src/lib/api.ts`
- `apps/web/src/styles/global.css`
- `docs/tasks/**`

## Forbidden Files

- `packages/**`
- `workers/**`

## Input Contract

Form fields:
- keyword (required, string, min 1)
- shippedFrom (optional, default "DKI Jakarta")
- limit (optional, default 10, 1-50)
- priceMin/priceMax (optional, number)
- minimumRating (optional, number 0-5)
- storeStatus (optional, multi-select)

## Output Contract

- On submit: POST /api/research/keyword-search → 202 with researchSessionId, jobId
- Poll GET /api/research/jobs/:id every 3s
- On status=completed/partialSuccess: navigate to /results/:researchSessionId

## Acceptance Criteria

- [ ] Page shows form with keyword, shippedFrom, limit, priceMin/Max, minimumRating, storeStatus fields
- [ ] Defaults shippedFrom to "DKI Jakarta" and limit to 10
- [ ] On submit, POST /api/research/keyword-search with correct payload
- [ ] Polls GET /api/research/jobs/:id every 3s after submission
- [ ] Navigates to result page on completed/partialSuccess
- [ ] Shows error states for 401, 400, etc.
- [ ] Component tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: renders all form fields
- [ ] Unit test: defaults shippedFrom and limit
- [ ] Unit test: submits correct payload
- [ ] Unit test: shows error on failure
- [ ] Unit test: navigates on completion

## Documentation Update

- [ ] No public docs changes

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
