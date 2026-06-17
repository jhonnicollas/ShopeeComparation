# TASK-036: Build protected routes

## Status

DONE

## Goal

Create authentication middleware and protected route components for the React frontend. The middleware checks if user is authenticated via /api/auth/me and redirects to /login if not. Protected routes wrap pages that require authentication.

## Required Reading

- `docs/api/api-contract.md` (auth/me endpoint)
- `docs/architecture/implementation-stack.md` (TanStack Router)
- `docs/standards/coding-standard.md`
- `docs/standards/testing-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create useAuth hook in apps/web/src/lib/auth.ts for client-side auth state.
- Create RequireAuth component that wraps protected routes.
- Add auth state to TanStack Query with stale time.
- Add loading state while checking auth.
- Redirect to /login if not authenticated.
- Apply RequireAuth to /compare, /keyword-search, /settings routes.
- Add auth state to AppShell (show user info or login link).
- Add component tests for RequireAuth and useAuth.

## Out of Scope

- Do not create admin role checking (later task).
- Do not create user profile page (later task).
- Do not implement auto token refresh (later task).

## Allowed Files

- `apps/web/src/lib/auth.ts` (add useAuth hook)
- `apps/web/src/components/RequireAuth.tsx`
- `apps/web/src/components/RequireAuth.test.tsx`
- `apps/web/src/app/router.tsx` (wrap protected routes)
- `apps/web/src/app/queryClient.ts` (if needed)
- `apps/web/src/app/router.tsx` (update AppShell)
- `apps/web/src/styles/**` (CSS for auth UI)
- `docs/tasks/**`

## Forbidden Files

- `workers/**`
- `packages/**`
- `.ai/**`

## Input Contract

User navigates to a protected route. Frontend checks auth state via /api/auth/me.

## Output Contract

- If authenticated: render the protected route content.
- If not authenticated: redirect to /login.
- If loading: show loading state.

## Acceptance Criteria

- [x] useAuth hook exists with isLoading, isAuthenticated, user
- [x] RequireAuth component exists
- [x] /compare route is protected
- [x] /keyword-search route is protected
- [x] /settings route is protected
- [x] Unauthenticated users are redirected to /login
- [x] AppShell shows user info when authenticated
- [x] AppShell shows login link when not authenticated
- [x] Component tests pass for RequireAuth
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] RequireAuth renders children when authenticated
- [x] RequireAuth redirects when not authenticated
- [x] RequireAuth shows loading state while checking
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
