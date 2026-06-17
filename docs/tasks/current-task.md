# TASK-033: Build logout API

## Status

DONE

## Goal

Implement POST /api/auth/logout endpoint that revokes the current session and clears the session cookie.

## Required Reading

- `docs/api/api-contract.md` (auth/logout endpoint)
- `docs/database/schema.md` (sh_sessions table)
- `docs/shared/enums.md`
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add POST /api/auth/logout route to workers/api/src/routes/auth.ts.
- Extract session token from cookie.
- Hash token and find session in D1.
- Revoke session by setting revokedAt timestamp.
- Clear session cookie.
- Return success response.
- Add unit tests for logout endpoint.

## Out of Scope

- Do not create /api/auth/me endpoint (TASK-034).
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

Client sends POST /api/auth/logout with session_token cookie.

## Output Contract

On success: 200 OK with JSON { success: true } and Set-Cookie to clear session.
On error: 401 if no valid session.

## Acceptance Criteria

- [x] POST /api/auth/logout route exists
- [x] Session token is extracted from cookie
- [x] Session is revoked in database
- [x] Session cookie is cleared
- [x] Returns 200 with success response
- [x] Returns 401 if no session cookie
- [x] Returns 401 if session is invalid
- [x] Unit tests pass for logout endpoint
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for successful logout
- [x] Unit test for missing session cookie
- [x] Unit test for invalid session token
- [x] Unit test for already revoked session
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
