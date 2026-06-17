# TASK-021: Setup D1 schema using sh_ tables and camelCase columns

## Status

DONE

## Goal

Create D1 SQL migration file(s) for all tables defined in docs/database/schema.md, following strict naming rules (sh_ prefix, camelCase columns, no underscores in column names).

## Required Reading

- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/architecture/implementation-stack.md`
- `docs/configuration/env-variables.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`

## Scope

- Create `packages/db` package with migrations directory.
- Create initial SQL migration file with all 20 tables from schema.md.
- Verify all table names start with `sh_`.
- Verify all column names use camelCase without underscores.
- Add package.json with migration scripts.
- Document migration execution process.
- Do not run migrations yet (requires wrangler D1 access).

## Out of Scope

- Do not create repository layer (later task).
- Do not create query helpers (later task).
- Do not seed data (later task).
- Do not execute migrations against live D1 (requires deployment).

## Allowed Files

- `packages/db/**`
- `docs/tasks/**`

## Forbidden Files

- `workers/**` (except if needed for types)
- `apps/web/**`
- `.ai/**`

## Input Contract

D1 database `multi_Ai_db` exists with binding `DB` in wrangler.toml. No tables exist yet.

## Output Contract

`packages/db/migrations/0001_initial_schema.sql` contains all 20 tables with correct naming. Migration can be applied via `wrangler d1 migrations apply`.

## Acceptance Criteria

- [x] `packages/db` directory exists
- [x] `packages/db/package.json` exists with name, scripts
- [x] `packages/db/migrations/0001_initial_schema.sql` exists
- [x] Migration file contains all 20 tables from schema.md
- [x] All table names start with `sh_`
- [x] All column names are camelCase without underscores
- [x] Migration file is valid SQL syntax
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [x] `node scripts/quality-gate.js` passes

## Test Requirements

- [x] No unit tests required for SQL migration files
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
