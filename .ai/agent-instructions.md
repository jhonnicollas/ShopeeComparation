# AI Agent Rules

## Mandatory Reading

Before coding, agent must read:

1. `docs/prd/prd.md`
2. `docs/architecture/technical-decisions.md`
3. `docs/architecture/system-overview.md`
4. `docs/api/api-contract.md`
5. `docs/database/schema.md`
6. `.ai/agent-rules.md`
7. `.ai/done-definition.md`
8. Current task file

## Hard Rules

1. Do not edit files outside allowed files.
2. Do not change technical decisions without ADR.
3. Do not change database naming rules.
4. All table names must start with `sh_`.
5. Column names must not contain underscore.
6. Use React + Vite for frontend.
7. Use pnpm workspace.
8. Use Zod for validation.
9. Use D1 for structured data.
10. Use R2 for large raw artifacts.
11. Use Cloudflare Queues for heavy async jobs.
12. Do not call Shopee directly from frontend.
13. Do not put Shopee parsing logic inside route handlers.
14. Do not hardcode secrets.
15. Do not invent missing Shopee data.
16. Every extracted field must have source and confidence.
17. AI must not determine numeric score freely.
18. Scoring must be deterministic.
19. Add tests for changed behavior.
20. Update docs if contract changes.

## Stop Conditions

Agent must stop and ask if:

- Task conflicts with technical decisions.
- Required data contract is missing.
- Task requires editing forbidden files.
- Task requires bypassing CAPTCHA/login.
- Task requires storing raw large data in D1.
# Forbidden Actions

AI agents must not:

1. Change framework from React + Vite.
2. Change package manager from pnpm.
3. Change validation library from Zod.
4. Change backend utama from Cloudflare Workers.
5. Change D1 as primary structured database.
6. Remove `sh_` table prefix.
7. Add underscore to database column names.
8. Store raw HTML or large JSON in D1.
9. Put Shopee scraping inside UI.
10. Call Shopee directly from frontend.
11. Bypass CAPTCHA.
12. Login to Shopee user account.
13. Access cart, checkout, order, user, or me pages.
14. Hardcode API keys.
15. Expose 9router key to frontend.
16. Let AI invent missing data.
# Definition of Done

A task is done only if:

1. It follows task scope.
2. It follows all technical decisions.
3. It does not edit forbidden files.
4. It passes lint.
5. It passes typecheck.
6. It passes tests.
7. It builds successfully.
8. It validates all external input with Zod.
9. It handles errors safely.
10. It updates documentation when contracts change.
11. It includes manual verification steps.
12. It does not invent missing product data.
# Review Checklist

## Scope

- [ ] Implementation matches task.
- [ ] No forbidden files edited.
- [ ] No unrelated refactor.

## Architecture

- [ ] Follows technical decisions.
- [ ] Frontend uses React + Vite.
- [ ] Package setup uses pnpm.
- [ ] Backend logic stays in Workers/services.
- [ ] Shopee logic stays in `packages/shopee`.
- [ ] AI logic stays in `packages/ai`.

## Database

- [ ] Tables use prefix `sh_`.
- [ ] Columns have no underscore.
- [ ] Columns use camelCase.
- [ ] Large raw data not stored in D1.

## Security

- [ ] No secret in frontend.
- [ ] Protected routes check auth.
- [ ] User data isolation enforced.
- [ ] No internal stacktrace exposed.

## Data Quality

- [ ] Missing Shopee data not invented.
- [ ] Fields have source and confidence.
- [ ] AI report mentions missing data.

## Tests

- [ ] Unit tests added or updated.
- [ ] Typecheck passes.
- [ ] Build passes.
# Commit Rules

## Branch Format

Use this branch format:

```txt
feature/TASK-XXX-short-title
```

Examples:

```txt
feature/TASK-020-wrangler-config
feature/TASK-040-config-tables
feature/TASK-070-mastra-workflow
```

## Commit Format

Use this commit format:

```txt
task(TASK-XXX): short task title
```

Commit body:

```txt
Summary:
- ...

Files changed:
- ...

Tests:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Notes:
- ...
```

## Commit Requirements

Commit only if:

- Current task acceptance criteria pass.
- Quality gate passes.
- Self-review passes.
- No stop condition is active.
- Documentation is updated if required.

## Forbidden Commits

Do not commit:

- Hardcoded secrets.
- Hardcoded runtime configuration.
- Destructive migrations.
- Table names without `sh_` prefix.
- Column names containing underscores.
- Broken build.
- Tests skipped without explanation.
- Generated files not required by the project.

## Merge Policy

For autopilot mode:

- Commit per task.
- Keep each task atomic.
- Do not squash unrelated tasks.
- Do not merge to production branch unless a deploy/release task explicitly requires it.
# Agent Roles

| Role | Allowed Responsibility |
|---|---|
| Product Agent | PRD, user stories, acceptance criteria |
| Architect Agent | Architecture, decisions, ADR |
| Backend Agent | Workers API, D1, R2, Queues |
| Frontend Agent | React + Vite UI |
| Shopee Agent | URL resolver, extractor, parser |
| AI Agent | Mastra, prompts, 9router |
| Core Agent | Scoring, risk, comparison |
| QA Agent | Tests and edge cases |
| Reviewer Agent | Review and merge decision |
| DevOps Agent | Wrangler, env, deployment |

Only one implementation agent may edit code for a task. Other agents review only.
