# TASK-107: Build keyword search result page

## Status

TODO

## Goal

Build keyword search result page that displays top 10 ranked products with score breakdown, product details (title, price, rating, sold, weight), shop info, and AI report. The page must handle both `compareLinks` and `keywordSearch` research session modes.

## Required Reading

- `docs/prd/prd.md` (section 8.3, 8.10)
- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/done-definition.md`

## Scope

- Update `apps/web/src/pages/ResultPage.tsx` to support `keywordSearch` mode
- Display keyword, shippedFrom, limit info when mode is `keywordSearch`
- Fetch AI report from GET /api/research/comparisons/:id/ai-report
- Display ranked products with full product details (title, priceMin, priceMax, rating, soldCount)
- Show weight if available
- Show shop info (name, status)
- Add tests

## Out of Scope

- Do not change backend API endpoints
- Do not implement scoring engine (already exists)
- Do not change D1 schema

## Allowed Files

- `apps/web/src/pages/ResultPage.tsx`
- `apps/web/src/pages/ResultPage.test.tsx`
- `apps/web/src/styles/global.css`
- `docs/tasks/**`

## Forbidden Files

- `packages/**`
- `workers/**`

## Input Contract

Route param: `researchSessionId`
Fetch from `GET /api/research/sessions/:id` and `GET /api/research/comparisons/by-session/:sessionId` and `GET /api/research/comparisons/:id/ai-report`

## Output Contract

Renders:
- Header with keyword search info (keyword, shippedFrom, total products)
- Best product (rank 1) callout
- Ranked list of products with: rank, product title, price, rating, sold count, shop name, score breakdown
- AI report section
- Weight info if available

## Acceptance Criteria

- [ ] Page handles both `keywordSearch` and `compareLinks` modes
- [ ] Shows keyword and shippedFrom for keywordSearch mode
- [ ] Renders ranked product cards with title, price, rating, sold
- [ ] Shows shop name and status if available
- [ ] Shows weight if available
- [ ] Shows AI report if available
- [ ] Component tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: renders for keywordSearch mode
- [ ] Unit test: renders for compareLinks mode
- [ ] Unit test: shows best product callout
- [ ] Unit test: shows AI report
- [ ] Unit test: shows loading and error states

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
