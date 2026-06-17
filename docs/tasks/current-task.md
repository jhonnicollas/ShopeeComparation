# TASK-030: Build auth schema

## Status

DONE

## Goal

Create auth-specific migration file and password hashing/validation utilities for the auth system. This includes password hashing with PBKDF2 (Web Crypto API), session token generation, and input validation helpers.

## Required Reading

- `docs/api/api-contract.md` (auth endpoints)
- `docs/database/schema.md` (sh_users, sh_sessions tables)
- `docs/database/naming-rules.md`
- `docs/shared/enums.md` (user roles, statuses)
- `docs/configuration/env-variables.md` (SESSION_SECRET, PASSWORD_PEPPER)
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/auth` package with auth utilities.
- Create `packages/auth/src/password.ts` with PBKDF2 password hashing.
- Create `packages/auth/src/session.ts` with session token generation and validation.
- Create `packages/auth/src/validation.ts` with email/password validation helpers.
- Add unit tests for all auth utilities.
- Use Web Crypto API (available in Cloudflare Workers).

## Out of Scope

- Do not create API route handlers (TASK-031, TASK-032, etc.).
- Do not create D1 repository layer (later task).
- Do not create frontend auth pages (TASK-035).
- Do not implement session storage (uses D1 sh_sessions table).

## Allowed Files

- `packages/auth/**`
- `docs/tasks/**`

## Forbidden Files

- `workers/**` (auth is reusable)
- `apps/web/**`
- `packages/db/**` (repositories are separate)
- `.ai/**`

## Input Contract

User provides email and password. System needs to hash passwords securely and generate session tokens.

## Output Contract

`packages/auth` exports password hashing, session token generation, and validation utilities. All functions are testable and use Web Crypto API.

## Acceptance Criteria

- [x] `packages/auth` directory exists
- [x] `packages/auth/package.json` exists
- [x] `packages/auth/src/password.ts` exists with hashPassword/verifyPassword
- [x] `packages/auth/src/session.ts` exists with generateSessionToken/hashSessionToken
- [x] `packages/auth/src/validation.ts` exists with validateEmail/validatePassword
- [x] All functions use Web Crypto API
- [x] Unit tests pass for all auth utilities
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] Unit test for password hashing and verification
- [x] Unit test for session token generation
- [x] Unit test for email/password validation
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
