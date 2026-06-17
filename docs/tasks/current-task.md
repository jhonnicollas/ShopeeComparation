# TASK-035: Build frontend login/register pages

## Status

DONE

## Goal

Create LoginPage and RegisterPage components in the React frontend that allow users to authenticate. Pages should use TanStack Query for API calls, Zod for client-side validation, and integrate with the backend auth API.

## Required Reading

- `docs/api/api-contract.md` (auth endpoints)
- `docs/architecture/implementation-stack.md` (frontend stack)
- `docs/standards/coding-standard.md`
- `docs/standards/testing-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create LoginPage component with email/password form.
- Create RegisterPage component with email/password/name form.
- Create API client helper for auth endpoints.
- Add /login and /register routes to TanStack Router.
- Use TanStack Query mutations for API calls.
- Show loading, error, and success states.
- Redirect to home on successful auth.
- Add component tests for both pages.

## Out of Scope

- Do not create protected route middleware (TASK-036).
- Do not create user profile page (later task).
- Do not create password reset flow (later task).
- Do not implement social login (later task).

## Allowed Files

- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/RegisterPage.tsx`
- `apps/web/src/pages/LoginPage.test.tsx`
- `apps/web/src/pages/RegisterPage.test.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/router.tsx` (add routes)
- `apps/web/src/app/queryClient.ts` (if needed)
- `apps/web/src/styles/**` (CSS)
- `docs/tasks/**`

## Forbidden Files

- `workers/**`
- `packages/**`
- `.ai/**`

## Input Contract

User fills form with email/password (and name for register). Frontend posts to backend auth API.

## Output Contract

On success: redirect to home page, session cookie set by backend.
On error: show error message inline.

## Acceptance Criteria

- [x] LoginPage component exists
- [x] RegisterPage component exists
- [x] /login route registered in TanStack Router
- [x] /register route registered in TanStack Router
- [x] Forms use Zod for client-side validation
- [x] API calls use TanStack Query mutations
- [x] Loading state shown during submission
- [x] Error state shown on failure
- [x] Success redirects to home
- [x] Component tests pass
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] LoginPage renders form
- [x] RegisterPage renders form
- [x] Existing tests still pass

## Documentation Update

- [x] Update task status files only

## Stop Conditions Check

- [x] No hard stop condition is triggered

## Completion Rule

Task is complete only when:

- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes.
- Self-review passes.
- Task is committed.
