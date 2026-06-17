# Stop Conditions

The autopilot must stop immediately when any condition below occurs.

## Secret and Credential Stops

Stop if:

- A new secret value is required from the user.
- A Cloudflare token, 9router token, session secret, or encryption key is missing.
- Any secret is found hardcoded in source files.
- Any secret is about to be written into Markdown, frontend code, or D1 as plaintext.

## Cloudflare Infrastructure Stops

Stop if:

- A task requires creating a new D1 database.
- A task requires changing the D1 binding from `DB`.
- A task requires changing the D1 database name from `multi_Ai_db`.
- A task requires changing the R2 binding from `LOGS`.
- A task requires changing the R2 bucket name from `multi-apps-ai-bucket`.
- A task requires deleting a Cloudflare resource.
- A task requires deploying to production without an explicit deploy task.

## Database Stops

Stop if:

- A migration is destructive.
- A table is created without `sh_` prefix.
- A column is created with an underscore.
- A column uses snake_case instead of camelCase.
- A task requires deleting production data.
- A task conflicts with `docs/database/schema.md` or `docs/database/naming-rules.md`.

## Architecture Stops

Stop if:

- A task requires changing locked technical decisions.
- A task conflicts with existing source of truth docs.
- A backlog task cannot be normalized into a complete task contract from the existing docs.
- The agent needs to replace the frontend framework, package manager, auth strategy, validation library, or job progress strategy.
- The agent needs to remove Mastra or 9router.

## Shopee Compliance Stops

Stop if:

- A task requires bypassing CAPTCHA or anti-bot protections.
- A task requires logging in to Shopee.
- A task accesses cart, checkout, order, user, or private Shopee pages.
- A task attempts aggressive scraping.
- A task collects personal user data from Shopee.

## Quality Gate Stops

Stop if:

- `pnpm build` fails after 3 fix attempts.
- `pnpm test` fails after 3 fix attempts.
- `pnpm typecheck` fails after 3 fix attempts.
- The same error repeats after 3 fix attempts.
- The reviewer agent marks the task as `FAIL` after 3 fix attempts.

## Failure Report Required

When stopped, write a failure report to `docs/tasks/failed.md` using `.ai/failure-report-template.md`.
