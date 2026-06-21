# AI Agent Rules

## Mandatory Reading

Before coding, agent must read:

1. `docs/prd.md` (Product Requirements Document, immutable source of truth)
2. `docs/architecture.md`
3. `docs/api/api-contract.md`
4. `docs/database/schema.md`
5. `docs/database/naming-rules.md`
6. `docs/shopee/extraction-strategy.md`
7. `docs/configuration/runtime-configuration.md`
8. `docs/deployment/checklist.md`
9. `.ai/autopilot-system.md` (if running autopilot)
10. Current task file (in `docs/tasks/` or `backlog.md`)

## Hard Rules

1. Do not edit files outside the task's allowed files.
2. Do not change technical decisions without an ADR (`docs/adr/`).
3. Do not change database naming rules.
4. All D1 table names must start with `sh_` (PRD §7 #14). Enforced by `scripts/validate-db-naming.js`.
5. D1 column names must not contain underscore. Enforced by `apps/web/src/__tests__/prd-compliance.test.ts`.
6. Use React + Vite for frontend (PRD §7 #1).
7. Use pnpm workspace (PRD §7 #2).
8. Use Zod for validation (PRD §7 #8).
9. Use Cloudflare D1 for structured data (PRD §7 #10). Existing `multi_Ai_db` only.
10. Use Cloudflare R2 for large raw artifacts (PRD §7 #12). Existing `multi-apps-ai-bucket` only.
11. Use Cloudflare Queues for heavy async jobs (PRD §7 #11).
12. Do not call Shopee directly from frontend.
13. Do not put Shopee parsing logic inside route handlers.
14. Do not hardcode secrets. Use `wrangler secret put`. D1 stores only `secretRef`.
15. Do not invent missing Shopee data. Failed extraction = `null` + `confidence 0` (PRD §8.6).
16. Every extracted field must have source and confidence.
17. AI must not determine numeric score freely. Scoring is deterministic in `packages/core` (PRD §7 #13, §8.9).
18. Add tests for changed behavior. PRD coverage tests live in `apps/web/src/__tests__/prd-*.test.ts`.
19. Update docs if contract changes.
20. Do not log secrets or stacktraces. `sanitizeForLog` in `packages/shopee/src/adapters/*` redacts API keys/tokens.

## Quality Gate

Before declaring a task complete:

```bash
node scripts/quality-gate.js
```

Must exit 0. The gate runs:

1. `pnpm lint` (ESLint)
2. `pnpm typecheck` (tsc --noEmit across all packages)
3. `pnpm test` (Vitest, all 76 test files including PRD coverage)
4. `pnpm build` (vite + tsc + Pages Function copy)
5. `scripts/validate-db-naming.js`
6. `scripts/validate-no-hardcode.js` (respects .gitignore)
7. `scripts/validate-source-of-truth.js`

## Stop Conditions

Agent must stop and ask if:

- Task conflicts with technical decisions or PRD.
- Required data contract is missing.
- Task requires editing forbidden files.
- Task requires bypassing CAPTCHA / Shopee login / cart / checkout / order / user/me.
- Task requires storing raw large data in D1.
- Task would add a new D1 database (PRD forbids this).
- Task would change `CLOUDFLARE_API_TOKEN` rotation requirements.

## Forbidden Actions

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
10. Login to a Shopee user account.
11. Access cart, checkout, order, user, or me endpoints.
12. Bypass CAPTCHA.
13. Add a fixture/mock data fallback that pollutes D1 (PRD §8.6 "tidak boleh mengarang").
14. Hardcode provider URL, model name, or scoring weight in source code (PRD §Runtime Configuration).
15. Add fixture/mocks to production code paths (tests only).

## Architecture Boundaries (PRD §Runtime Boundaries)

- `apps/web` cannot import from `workers/`.
- `apps/web` can import `packages/shared` and `packages/core` only.
- `workers/api` and `workers/queueConsumer` can import from `packages/*`.
- Shopee-specific logic must not exist outside `packages/shopee`.
- AI prompt logic must not exist outside `packages/ai`.
- Scoring logic must not exist outside `packages/core`.

## Production Environment

- D1: `multi_Ai_db` (id `b80ca989-6771-427f-a656-c7ab6ffc17ce`), binding `DB`.
- R2: `multi-apps-ai-bucket`, binding `LOGS`.
- Queue: `shopee-research-queue` (producer) + DLQ `shopee-research-dlq`.
- Pages: `shopee-product-research-web`.
- API Worker: `shopee-product-research-api`.
- Queue Consumer: `shopee-product-research-queue-consumer`.
- Cloudflare account: `79dea2845a4b62ea5229c8676dea02c0`.

## Known Production Constraints (Cannot be Code-Fixed)

- **Shopee anti-bot blocks Cloudflare Workers** — both `CloudflareBrowserRenderingAdapter` and `NineRouterFetchAdapter` cannot extract real Shopee data. App fails with `noData` rather than fabricating.
- **Real Shopee data** requires Shopee Open Platform partnership (`https://openplatform.shopee.com`) — out of MVP code scope.
- **`PASSWORD_PEPPER`** is set to a known production value to allow deterministic password verification after admin user recreation. Future changes require coordinated D1 reset.
