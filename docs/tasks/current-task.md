# TASK-110: Build dashboard page

## Status

TODO

## Goal

Build a frontend dashboard page that shows an overview of the user's research activity: total research sessions, recent jobs, status counts, and quick actions to start new research. The page is the user's home for managing their research.

## Required Reading

- `docs/prd/prd.md` (section 5.2 admin)
- `docs/architecture/technical-decisions.md`
- `docs/api/api-contract.md` (Research API)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/done-definition.md`

## Scope

- Create `apps/web/src/pages/DashboardPage.tsx`
- Fetch user research sessions via GET /api/research
- Show stats: total sessions, completed, failed, partialSuccess
- Show list of recent sessions (top 5)
- Show quick action links: compare-links, keyword-search, settings
- Add route `/dashboard`
- Update `apps/web/src/app/router.tsx` to add route
- Add tests

## Out of Scope

- Do not change backend API
- Do not change D1 schema
- Do not implement admin-only features (user-scoped only)

## Allowed Files

- `apps/web/src/pages/DashboardPage.tsx` (new)
- `apps/web/src/pages/DashboardPage.test.tsx` (new)
- `apps/web/src/app/router.tsx`
- `apps/web/src/styles/global.css`
- `workers/api/src/routes/research.ts`
- `workers/api/src/routes/research.test.ts`
- `docs/tasks/**`

## Forbidden Files

- `packages/db/**` (no schema changes; reuse existing repos)
- `packages/shopee/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

Fetch from `GET /api/research` returning:
```ts
{
  items: Array<{
    id: string;
    mode: "compareLinks" | "keywordSearch";
    keyword: string | null;
    status: "pending" | "processing" | "completed" | "failed" | "partialSuccess";
    bestProductId: string | null;
    createdAt: string;
  }>
}
```

## Output Contract

Dashboard shows:
- Welcome header
- Stats cards: total, completed, failed, partialSuccess
- Recent sessions list (top 5 with mode, keyword/status/createdAt)
- Quick action links

## Acceptance Criteria

- [ ] DashboardPage component renders
- [ ] Fetches from GET /api/research
- [ ] Shows stats cards
- [ ] Shows recent sessions list
- [ ] Shows quick action links
- [ ] Route /dashboard added
- [ ] Component tests pass
- [ ] All existing tests pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test: renders dashboard with stats
- [ ] Unit test: renders recent sessions
- [ ] Unit test: shows loading state
- [ ] Unit test: shows empty state when no sessions
- [ ] Unit test: shows error state

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
