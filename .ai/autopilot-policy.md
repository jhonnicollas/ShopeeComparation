# Autopilot Policy

## Mode

This project uses **100% Autonomous Build Mode**.

The AI coding agent may execute the entire backlog without asking for confirmation, as long as it obeys the source of truth docs, task scope, stop conditions, quality gates, and security rules.

## Autopilot May Do

The autopilot may automatically:

- Create and modify files required by the active task.
- Create feature branches.
- Install dependencies listed in source of truth docs.
- Add tests.
- Run lint, typecheck, test, build, and dry-run deploy checks.
- Update task status files.
- Commit task changes after quality gates pass.
- Continue to the next task.
- Fix failed implementation up to 3 attempts.
- Refactor code if it is inside the active task scope.
- Update documentation related to the active task.

## Autopilot Must Not Do

The autopilot must not:

- Create a new D1 database.
- Rename or replace the D1 binding `DB`.
- Rename or replace the R2 binding `LOGS`.
- Store secrets in code, Markdown, frontend, or plaintext database rows.
- Hardcode provider, model, base URL, scoring weight, search provider, or feature flags.
- Create tables without the `sh_` prefix.
- Create database columns containing underscores.
- Change locked technical decisions without a new approved ADR.
- Write Shopee scraping logic inside frontend components.
- Use AI to fabricate missing product data.
- Access Shopee login, cart, checkout, order, user, or private pages.
- Bypass CAPTCHA, authentication, rate limits, or access protections.
- Perform destructive migrations.
- Deploy production unless a specific deploy command/task exists.

## Autopilot Execution Boundaries

Each task must have:

- Goal.
- Scope.
- Out of scope.
- Allowed files.
- Forbidden files.
- Acceptance criteria.
- Test requirements.
- Documentation update requirement.

If a task lacks these fields, the autopilot must normalize the task using `docs/tasks/task-template.md` before implementation.

If the backlog item itself is only a title, the agent must expand it into `docs/tasks/current-task.md` using:

1. `docs/tasks/task-template.md`
2. `docs/tasks/autopilot-task-contract.md`
3. the relevant source-of-truth docs for that phase

The agent must not start coding until the task is fully normalized.

## Retry Rules

For each task:

- Maximum implementation attempts: 3.
- Maximum quality gate attempts: 3.
- Maximum review-fix loop attempts: 3.

After 3 failed attempts, stop and write a failure report.

## Commit Rules

Commit only after:

- Quality gate passes.
- Self-review passes.
- No hard stop condition is active.
- Task acceptance criteria are satisfied.

## Final State

The project is complete when:

- Every backlog task is marked `DONE`.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- Database naming validation passes.
- No-hardcode validation passes.
- Source of truth validation passes.
