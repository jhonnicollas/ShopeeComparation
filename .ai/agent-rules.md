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
