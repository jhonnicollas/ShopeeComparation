# TASK-114: Build product detail page

## Status

TODO

## Goal

Build a frontend product detail page that shows all extracted product data, including scores, weights, features, source attribution, and confidence levels.

## Required Reading

- `docs/prd/prd.md`
- `docs/api/api-contract.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/done-definition.md`

## Scope

- Add GET /api/research/products/:id endpoint
- Create `apps/web/src/pages/ProductDetailPage.tsx`
- Add route `/products/:productId`
- Update `apps/web/src/app/router.tsx`
- Add tests

## Out of Scope

- Do not change D1 schema
- Do not implement admin-only features

## Allowed Files

- `apps/web/src/pages/ProductDetailPage.tsx` (new)
- `apps/web/src/pages/ProductDetailPage.test.tsx` (new)
- `apps/web/src/app/router.tsx`
- `apps/web/src/styles/global.css`
- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/research.test.ts`
- `docs/tasks/**`

## Forbidden Files

- `packages/db/**`
- `packages/shopee/**`
- `packages/core/**`
- `packages/ai/**`

## Acceptance Criteria

- [ ] GET /api/research/products/:id endpoint added
- [ ] ProductDetailPage component renders
- [ ] Route /products/:productId added
- [ ] Component tests pass
- [ ] Quality gate passes

## Completion Rule

Task is complete only when all quality gates pass and task is committed.
