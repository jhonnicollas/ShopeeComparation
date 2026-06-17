# Autopilot Task Contract

This document defines how an autopilot agent must expand backlog items that only contain a task id and title.

## Normalization Rule

Before implementing any task, the agent must copy the task into `docs/tasks/current-task.md` and expand it using `docs/tasks/task-template.md` plus the defaults in this file.

If any field is still unclear after applying this document, the task is `BLOCKED` and the agent must write a failure report instead of guessing.

## Global Required Reading

Every task must read:

- `README.md`
- `.ai/agent-rules.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`
- `.ai/done-definition.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/shared/enums.md`
- `docs/database/naming-rules.md`
- `docs/tasks/current-task.md`

## Global Scope Rules

Every task must:

- Follow existing folder structure.
- Keep route handlers thin.
- Use Zod for external input and output.
- Add or update tests for changed behavior.
- Update docs only when behavior or contracts change.
- Preserve existing user or generated changes that are unrelated to the task.

## Global Forbidden Scope

No task may:

- Create a new D1 database.
- Change D1 binding `DB`.
- Change R2 binding `LOGS`.
- Store secrets in repo, frontend, Markdown, D1, or logs.
- Hardcode runtime configuration except safe bootstrap defaults.
- Add Shopee login, CAPTCHA bypass, cart, checkout, order, user, or private page access.
- Put Shopee parsing in frontend code.
- Let AI invent missing Shopee data.
- Commit a broken build after the root project exists.

## Phase Defaults

### Phase 0 Source of Truth

Allowed files:

- `README.md`
- `MANIFEST.md`
- `VALIDATION.md`
- `.ai/**`
- `docs/**`
- `scripts/**`

Forbidden files:

- `apps/**`
- `workers/**`
- `packages/**`

Acceptance:

- Source-of-truth files exist.
- Validation scripts can run without the application scaffold.
- No implementation code is created.

### Phase 1 Monorepo Foundation

Allowed files:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig*.json`
- `eslint.config.*`
- `prettier.config.*`
- `vitest.config.*`
- `apps/**`
- `workers/**`
- `packages/**`
- `docs/**`

Acceptance:

- Root scripts exist: `lint`, `typecheck`, `test`, `build`.
- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run.
- No feature behavior is implemented beyond scaffold and health checks.

### Phase 2 Cloudflare Foundation

Allowed files:

- `workers/**`
- `packages/db/**`
- `packages/shared/**`
- `docs/**`
- `scripts/**`
- `wrangler*.toml`

Acceptance:

- Wrangler config uses existing `DB`, `LOGS`, and `RESEARCH_QUEUE` bindings.
- D1 migrations match `docs/database/schema.md`.
- Queue payload schemas are defined in shared package.
- Environment validation exists.

### Phase 3 Auth

Allowed files:

- `workers/api/**`
- `packages/db/**`
- `packages/shared/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Register, login, logout, and me endpoints work.
- Passwords are hashed with WebCrypto PBKDF2-SHA-256.
- Session tokens are stored only as hashes.
- Protected frontend routes require authenticated user.

### Phase 4 Runtime Configuration

Allowed files:

- `workers/api/**`
- `packages/db/**`
- `packages/shared/**`
- `packages/ai/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Config CRUD APIs are admin-only.
- Config UI never shows secret values.
- 9router provider and model tests are performed from backend only.
- Runtime config is loaded from D1 with safe bootstrap fallback.

### Phase 5 Mock Shopee Flow

Allowed files:

- `packages/shopee/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/api/**`
- `workers/queueConsumer/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Compare links flow works end-to-end using fixtures.
- Jobs can be created and polled.
- Products, shops, weights, and comparison items are saved to D1.

### Phase 6 Scoring and Risk

Allowed files:

- `packages/core/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Scoring is deterministic and tested.
- Score range is clamped to `0..100`.
- Risk penalty is included in breakdown.
- UI displays ranking, score, breakdown, and red flags.

### Phase 7 Mastra and 9router

Allowed files:

- `packages/ai/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- AI report uses structured data only.
- AI output is schema-validated.
- Raw large AI response goes to R2.
- Model/provider are loaded from config, not hardcoded.

### Phase 8 Real Shopee URL Resolver

Allowed files:

- `packages/shopee/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Resolver supports full URLs and `id.shp.ee`.
- Failed URL resolution produces partial success, not full job crash.
- Resolver diagnostics do not expose secrets.

### Phase 9 Real Shopee Extraction

Allowed files:

- `packages/shopee/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Extraction is adapter-based.
- CAPTCHA/login/private pages are not accessed.
- Missing data stays null with confidence `0`.
- Raw snapshots are stored in R2.

### Phase 10 Keyword Search

Allowed files:

- `packages/shopee/**`
- `packages/core/**`
- `packages/shared/**`
- `packages/db/**`
- `workers/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- Keyword search creates async job.
- Default shippedFrom is `DKI Jakarta`.
- Result is top 10 by deterministic score.
- Provider priority is loaded from D1.

### Phase 11 History and Dashboard

Allowed files:

- `workers/api/**`
- `packages/db/**`
- `packages/shared/**`
- `apps/web/**`
- `docs/**`

Acceptance:

- User can view only their own research data.
- Admin can view job and error logs.
- Result detail pages reuse existing API contracts.

### Phase 12 Hardening

Allowed files:

- `workers/**`
- `packages/**`
- `apps/web/**`
- `docs/**`
- `scripts/**`

Acceptance:

- Rate limiting, retry policy, error standardization, audit logs, validation scripts, and deployment docs are complete.
- Final README runbook is accurate.

## Completion Update

When a task passes, update:

- `docs/tasks/backlog.md`
- `docs/tasks/current-task.md`
- `docs/tasks/done.md`

When a task fails, update:

- `docs/tasks/current-task.md`
- `docs/tasks/failed.md`
