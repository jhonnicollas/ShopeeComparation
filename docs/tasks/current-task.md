# TASK-034: Build me API

## Status

DONE

## Goal

Implement GET /api/auth/me endpoint that returns the current authenticated user's information based on session cookie. This is used by frontend to check auth state and get user profile.

## Required Reading

- `docs/api/api-contract.md` (auth/me endpoint)
- `docs/database/schema.md` (sh_users, sh_sessions tables)
- `docs/shared/enums.md` (user roles, statuses)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add GET /api/auth/me route to workers/api/src/routes/auth.ts.
- Extract session token from cookie.
- Hash token and find session in D1.
- Validate session is not expired and not revoked.
- Find user by session userId.
- Return user info using meResponseSchema.
- Add unit tests for me endpoint.

## Out of Scope

- Do not create update profile endpoint (later task).
- Do not create protected route middleware (TASK-036).
- Do not implement session refresh (later task).

## Allowed Files

- `workers/api/src/routes/auth.ts`
- `workers/api/src/routes/auth.test.ts`
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/auth/**` (already done)
- `packages/db/**` (repositories already done)
- `.ai/**`

## Input Contract

Client sends GET /api/auth/me with session_token cookie.

## Output Contract

On success: 200 OK with JSON { user: { id, email, name, role } }.
On error: 401 if no valid session.

## Acceptance Criteria

- [x] GET /api/auth/me route exists
- [x] Session token is extracted from cookie
- [x] Session is validated (not expired, not revoked)
- [x] User info is returned based on session userId
- [x] Returns 401 if no session cookie
- [x] Returns 401 if session is invalid
- [x] Returns 401 if user not found
- [x] Returns 401 if user is disabled
- [x] Unit tests pass for me endpoint
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for successful me query
- [x] Unit test for missing session cookie
- [x] Unit test for invalid session token
- [x] Unit test for expired session
- [x] Unit test for disabled user
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
