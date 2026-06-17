# TASK-031: Build register API

## Status

DONE

## Goal

Implement POST /api/auth/register endpoint that creates a new user account, hashes the password, stores the user in D1, creates a session, and returns user info with session cookie.

## Required Reading

- `docs/api/api-contract.md` (auth/register endpoint)
- `docs/database/schema.md` (sh_users, sh_sessions tables)
- `docs/shared/enums.md` (user roles, statuses)
- `docs/standards/coding-standard.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create D1 repository functions for users and sessions.
- Add POST /api/auth/register route to workers/api.
- Validate request using registerRequestSchema.
- Hash password using auth package.
- Generate session token and store in D1.
- Set HTTP-only session cookie.
- Return user info using registerResponseSchema.
- Add error handling for duplicate emails.
- Add unit tests for register endpoint.

## Out of Scope

- Do not create login/logout endpoints (TASK-032, TASK-033).
- Do not create frontend pages (TASK-035).
- Do not create protected route middleware (TASK-036).
- Do not implement email verification (later task).

## Allowed Files

- `workers/api/src/**`
- `packages/db/src/repositories/**` (new)
- `packages/db/src/repositories/*.test.ts`
- `packages/db/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/web/**`
- `packages/auth/**` (already done in TASK-030)
- `.ai/**`

## Input Contract

Client sends POST /api/auth/register with JSON body: { email, password, name? }.

## Output Contract

On success: 201 Created with JSON { user: { id, email, name, role } } and Set-Cookie header.
On error: 400/409 with standard error response.

## Acceptance Criteria

- [x] D1 user repository functions exist
- [x] D1 session repository functions exist
- [x] POST /api/auth/register route exists
- [x] Request validation uses registerRequestSchema
- [x] Password is hashed before storage
- [x] Session cookie is HTTP-only and secure
- [x] Duplicate email returns 409 error
- [x] Invalid input returns 400 error
- [x] Unit tests pass for register endpoint
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for successful registration
- [x] Unit test for duplicate email
- [x] Unit test for invalid input
- [x] Unit test for password hashing
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
