# TASK-032: Build login API

## Status

DONE

## Goal

Implement POST /api/auth/login endpoint that authenticates a user with email and password, creates a session, and returns user info with session cookie.

## Required Reading

- `docs/api/api-contract.md` (auth/login endpoint)
- `docs/database/schema.md` (sh_users, sh_sessions tables)
- `docs/shared/enums.md` (user roles, statuses)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Add POST /api/auth/login route to workers/api/src/routes/auth.ts.
- Validate request using loginRequestSchema.
- Find user by email and verify password.
- Create session and set HTTP-only cookie.
- Return user info using loginResponseSchema.
- Add error handling for invalid credentials.
- Add unit tests for login endpoint.

## Out of Scope

- Do not create logout endpoint (TASK-033).
- Do not create rate limiting (later task).
- Do not create 2FA (later task).
- Do not create frontend pages (TASK-035).

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

Client sends POST /api/auth/login with JSON body: { email, password }.

## Output Contract

On success: 200 OK with JSON { user: { id, email, role } } and Set-Cookie header.
On error: 401 with standard error response for invalid credentials.

## Acceptance Criteria

- [x] POST /api/auth/login route exists
- [x] Request validation uses loginRequestSchema
- [x] Password is verified against stored hash
- [x] Session cookie is set on success
- [x] Invalid credentials returns 401
- [x] Non-existent email returns 401 (not 404)
- [x] Disabled account returns 401
- [x] Unit tests pass for login endpoint
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for successful login
- [x] Unit test for wrong password
- [x] Unit test for non-existent email
- [x] Unit test for disabled account
- [x] Unit test for invalid input
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
