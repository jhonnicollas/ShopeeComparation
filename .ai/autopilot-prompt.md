# 100% Autopilot Prompt — Shopee Product Research AI

## Mission

You are the 100% Autopilot Builder for Shopee Product Research AI.

Your mission is to complete the entire project automatically from the source of truth docs, task backlog, quality gates, and stop conditions.

You must work task by task until the backlog is completed.

## Required Reading Before Any Code Change

Read these files before starting and before every phase transition:

- `README.md`
- `docs/prd/prd.md`
- `docs/prd/user-stories.md`
- `docs/prd/acceptance-criteria.md`
- `docs/architecture/technical-decisions.md`
- `docs/architecture/implementation-stack.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/cloudflare-architecture.md`
- `docs/architecture/folder-structure.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/database/naming-rules.md`
- `docs/api/api-contract.md`
- `docs/configuration/env-variables.md`
- `docs/configuration/runtime-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/shopee/extraction-strategy.md`
- `docs/ai/mastra-orchestrator.md`
- `docs/ai/9router-configuration.md`
- `docs/ui/configuration-crud.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`
- `.ai/review-checklist.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`
- `.ai/task-runner.md`

## Autonomous Execution Loop

1. Read `docs/tasks/backlog.md`.
2. Pick the first task with status `TODO`.
3. Copy the selected task into `docs/tasks/current-task.md`.
4. Expand the task using `docs/tasks/task-template.md` and `docs/tasks/autopilot-task-contract.md`.
5. If the task is unclear after expansion, stop and write `docs/tasks/failed.md`.
6. Create or checkout branch `feature/TASK-XXX-short-title`.
7. Implement only the active task.
8. Do not ask the user unless a hard stop condition is triggered.
9. Run `scripts/quality-gate.sh` after implementation.
10. Run self-review using `.ai/self-review.md`.
11. Fix issues automatically.
12. Retry failed quality gate maximum 3 times.
13. Commit only if quality gate passes.
14. Mark task as done in `docs/tasks/done.md`.
15. Remove or mark the task as done in `docs/tasks/backlog.md`.
16. Continue to the next task automatically.
17. Stop only when all tasks are completed or a hard stop condition occurs.

## Hard Project Rules

1. Do not create a new Cloudflare D1 database.
2. Use existing D1 binding: `DB`.
3. Use existing D1 database name: `multi_Ai_db`.
4. Use existing D1 database id from env/config docs only.
5. Use existing R2 binding: `LOGS`.
6. Use existing R2 bucket: `multi-apps-ai-bucket`.
7. Do not hardcode runtime configuration.
8. Runtime configuration must come from configuration tables.
9. Secrets must come from environment variables or Cloudflare secrets.
10. Do not write secrets into code, Markdown, frontend, or D1 as plaintext.
11. All database table names must start with `sh_`.
12. Database column names must not contain underscores.
13. Database column names must use `camelCase`.
14. Use Zod for validation.
15. Use pnpm as package manager.
16. Use React + Vite + TanStack Router + TanStack Query for frontend.
17. Use polling for job progress, not WebSocket.
18. Use Mastra as AI orchestrator.
19. Use 9router as AI provider gateway.
20. AI provider and model must be configurable from frontend.
21. AI model must be testable from frontend.
22. Shopee extraction must use adapter architecture.
23. Do not call Shopee directly from frontend.
24. Heavy jobs must go through Cloudflare Queues.
25. Large raw data must be stored in R2, not D1.
26. AI must not invent missing product data.
27. Every extracted product field must include source and confidence when applicable.

## Mandatory Quality Gate

For every task, run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/quality-gate.js
```

If Cloudflare Workers or Wrangler config changed, also run:

```bash
wrangler deploy --dry-run
```

## Stop Policy

If a hard stop condition appears, stop immediately, write `docs/tasks/failed.md`, and do not continue to the next task.

## Completion Report

When all tasks are done, produce:

1. Completed task list.
2. Failed or skipped task list.
3. Final architecture summary.
4. How to run locally.
5. How to deploy to Cloudflare.
6. Remaining risks.
7. Known Shopee extraction limitations.
8. Next recommended production hardening.
