# Shopee Product Research AI

Web app multi-user berbasis Cloudflare-first untuk riset produk Shopee.

**Dua workflow utama (PRD §6):**
1. **Keyword Search Top 10** — user input keyword, sistem cari 10 produk terbaik dengan filter `Shipped From = DKI Jakarta`.
2. **Compare Links** — user paste 1–5 link produk Shopee (termasuk short URL `id.shp.ee/...`), sistem compare + ranking.

**Stack:** React + Vite (frontend), Cloudflare Workers (API + Queue Consumer), D1 (database), R2 (snapshots), Queues (async jobs), Mastra (AI orchestrator), 9router (AI gateway via Cloudflare Browser Rendering).

## Project Structure

```
apps/web/                 # React + Vite + TanStack Router + TanStack Query
workers/api/              # Cloudflare Workers API (Hono)
workers/queueConsumer/    # Cloudflare Queue consumer
packages/ai/              # Mastra + 9router integration
packages/auth/            # Password hashing (PBKDF2-SHA-256), session
packages/core/            # Deterministic scoring, risk detection, quality checker
packages/db/              # D1 repositories, R2 helpers, migrations
packages/shared/          # Zod schemas, enums, types, response parsers
packages/shopee/         # URL resolver, parsers, search/extract adapters
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run quality gate (lint, typecheck, test, build, validators)
node scripts/quality-gate.js

# Deploy API
pnpm exec wrangler deploy --config workers/api/wrangler.toml

# Deploy queue consumer
pnpm exec wrangler deploy --config workers/queueConsumer/wrangler.toml

# Build + deploy frontend to Cloudflare Pages
pnpm --filter @shopee-research/web deploy:pages
```

## Source of Truth Documents

| File | Fungsi |
|---|---|
| `docs/prd.md` | Product Requirements Document (immutable source of truth) |
| `docs/architecture.md` | Arsitektur, technical decisions, stack |
| `docs/api/api-contract.md` | Kontrak HTTP API |
| `docs/database/schema.md` | D1 schema (21 tables) |
| `docs/database/naming-rules.md` | Aturan `sh_` prefix + camelCase columns |
| `docs/database/d1-strategy.md` | D1 binding, ID, R2 binding strategy |
| `docs/shared/enums.md` | Enum canonical |
| `docs/ai-orchestration.md` | Mastra workflow, agentic loop, 9router config |
| `docs/shopee/extraction-strategy.md` | Adapter chain (9router → BrowserRun → CloudflareBrowserRendering) |
| `docs/shopee/search-api-strategy.md` | Search adapter priority and fallback |
| `docs/shopee/url-resolver.md` | Short URL resolution |
| `docs/shopee/data-fields.md` | Product/Shop snapshot fields |
| `docs/scoring/scoring-engine.md` | Deterministic scoring formula |
| `docs/configuration/env-variables.md` | Environment variable reference |
| `docs/configuration/runtime-configuration.md` | D1 config + precedence rules |
| `docs/ui/configuration-crud.md` | Admin Settings UI |
| `docs/deployment/checklist.md` | Deployment runbook |
| `docs/standards/*.md` | Coding/error/logging/security/testing standards |
| `docs/tasks/*` | Task tracker (backlog/done/failed) |
| `.ai/agent-instructions.md` | Wajib dibaca AI coding agent |

## Mandatory Rules

1. **Table prefix**: every D1 table must start with `sh_` (PRD §7 #14, enforced by `scripts/validate-db-naming.js`).
2. **Column naming**: no underscore in column names — use camelCase.
3. **Frontend**: React + Vite + TanStack Router + TanStack Query (PRD §7 #1).
4. **Package manager**: pnpm + pnpm workspace (PRD §7 #2).
5. **Validation**: Zod schemas in `packages/shared` (PRD §7 #8).
6. **Backend**: Cloudflare Workers (PRD §7 #9).
7. **Database**: Cloudflare D1 with `multi_Ai_db` (PRD §7 #10, §Cloudflare Resource Requirement).
8. **Queue**: Cloudflare Queues (PRD §7 #11).
9. **Storage**: Cloudflare R2 bucket `multi-apps-ai-bucket` (PRD §7 #12).
10. **AI orchestration**: Mastra (PRD §7 #13).
11. **AI gateway**: 9router via Cloudflare Browser Rendering (production).
12. **ID generation**: nanoid + entity prefix (`usr_`, `ses_`, `rsr_`, `prd_`, `shp_`, `cmp_`, `job_`).
13. **Auth**: WebCrypto PBKDF2-SHA-256, ≥100,000 iterations, opaque session token hashed in D1, `shSession` HttpOnly cookie.
14. **Shopee extraction**: adapter-based, never bypass CAPTCHA/login, never access cart/checkout/order/user/me.
15. **No fabricated data**: failed extraction = `null` + `confidence 0`. PRD §8.6 compliance.
16. **No hardcoded secrets**: all secrets in `wrangler secret put`, D1 only stores `secretRef`.

## Test Coverage

**76 test files, 821 tests, quality gate EXIT 0.**

PRD-aligned coverage:
- `apps/web/src/__tests__/prd-compliance.test.ts` (17 tests) — G11/G12, §9, §Runtime Config
- `apps/web/src/__tests__/prd-resources.test.ts` (13 tests) — §12 metrics, §Cloudflare Resource

## Known Production Constraint

Per PRD §7 #7, the system uses adapter-based extraction: official Shopee API → lightweight fetch → 9router web fetch → Browser Run → Cloudflare Browser Rendering → optional VPS scraper. **In production, Shopee identifies Cloudflare Workers as a bot and serves an empty SPA shell**, so real Shopee search returns zero results. The app fails honestly with `noData` rather than fabricating mock data. To get real Shopee data, apply for the [Shopee Open Platform](https://openplatform.shopee.com) partnership and integrate the official API.

## Deployment

See `docs/deployment/checklist.md` for the full runbook. Existing production resources:
- D1: `multi_Ai_db` (ID `b80ca989-6771-427f-a656-c7ab6ffc17ce`)
- R2: `multi-apps-ai-bucket`
- Queue: `shopee-research-queue` + DLQ `shopee-research-dlq`
- Cloudflare account: `79dea2845a4b62ea5229c8676dea02c0`

## Latest Release

`f301fc7 fix(search,auth,ui): real Shopee data + cache + PRD coverage`
- 6 root-cause bug fixes (SSE parser, agentic loop, env passthrough, mock fallback, statusJson join, cache + 404)
- 40 new PRD-aligned tests
- Pages Function with cache-busting + asset fallback
