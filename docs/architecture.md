# Cloudflare Architecture

## Cloudflare Services

| Service | Usage | Production Binding |
|---|---|---|
| Cloudflare Pages | Host React + Vite frontend (SPA) + Pages Functions for `/api/*` proxy | `shopee-product-research-web.pages.dev` |
| Cloudflare Workers | Backend API (Hono) and queue consumers | `shopee-product-research-api`, `shopee-product-research-queue-consumer` |
| Cloudflare D1 | Structured relational data (21 tables, all `sh_` prefix) | `DB` → `multi_Ai_db` (id `b80ca989-6771-427f-a656-c7ab6ffc17ce`) |
| Cloudflare R2 | Raw snapshots and large artifacts (HTML, JSON, AI raw) | `LOGS` → `multi-apps-ai-bucket` |
| Cloudflare Queues | Async job execution | `RESEARCH_QUEUE` → `shopee-research-queue` + DLQ `shopee-research-dlq` |
| Cloudflare Browser Run | Primary Shopee rendering (headless Chromium via REST API) | Used via `packages/shopee/src/adapters/cloudflareBrowserRenderingAdapter.ts` |

## Request Flow

### Compare Links

```txt
User submits 1–5 links (browser)
  ↓
Pages Function (_worker.js) proxies /api/* to API Worker
  ↓
API Worker (Hono) validates session, input via Zod
  ↓
API Worker creates sh_researchSessions + sh_jobs rows
  ↓
API Worker enqueues message to RESEARCH_QUEUE → returns 202
  ↓
Queue Consumer receives message
  ↓
loadSearchConfig(env.DB) — reads from sh_searchProviderConfigs
  ↓
loadSearchConfig returns CLOUDFLARE_* env or webFetch fallback
  ↓
CloudflareBrowserRenderingAdapter / NineRouterFetchAdapter / BrowserRunAdapter
  ↓
For each link:
  → resolveUrl (short URL id.shp.ee → canonical)
  → extractProduct (Cloudflare Browser Rendering snapshot)
  → extractShop (same)
  ↓
D1: sh_products, sh_shops, sh_productWeights, sh_productFeatures upsert
R2: raw HTML/JSON snapshots via saveRawProductSnapshot
  ↓
packages/core: calculateProductScore + detectRisks + rankProducts
  ↓
packages/ai: runResearchWorkflow via Mastra (3 agents)
  → RecommendationWriter
  → RiskAnalyzer
  → DataQualityAgent
  ↓
9router via 9router client → AI report JSON (Zod-validated)
  ↓
sh_aiReports row + R2 rawResponseR2Key
  ↓
sh_comparisons + sh_comparisonItems (rank 1..N)
  ↓
sh_jobs.status = completed | partialSuccess | failed
  ↓
Frontend polls /api/research/jobs/:id every 3s → /result/:sessionId
```

### Keyword Search

```txt
User submits keyword + shippedFrom + limit (browser)
  ↓
API Worker validates input (Zod)
  ↓
Queue Consumer picks up message
  ↓
loadSearchConfig + CLOUDFLARE_* env check
  ↓
CloudflareBrowserRenderingAdapter.searchProducts(keyword)
  → Renders https://shopee.co.id/search?keyword=...
  → Cheerio extracts product URLs from rendered HTML
  → Returns SearchResultCandidate[]
  ↓
[If 0 candidates returned by real fetch — job fails with noData]
  ↓
Dedupe by shopId:itemId
  ↓
For each candidate: extractProduct + extractShop via adapter
  ↓
shippedFromFilter (DKI Jakarta priority)
  ↓
candidateEnrichmentJob (parallel, bounded concurrency)
  ↓
topTenRanking
  ↓
scoring + risk + AI report (same as Compare Links)
  ↓
Result persisted to D1, frontend polls
```

## Runtime Boundaries

Frontend must only call internal API (proxied by Pages Function).

API Worker must not contain parsing logic. It calls services.

Shopee extraction must live in `packages/shopee`.

Scoring must live in `packages/core`.

AI prompt and workflow must live in `packages/ai`.

D1 schema must live in `packages/db/migrations`.

## Data Flow

### Compare Links Data Flow

```txt
Input links
  ↓
Zod validation (researchSchema)
  ↓
research session row (sh_researchSessions)
  ↓
job row (sh_jobs, status=pending)
  ↓
queue message (QueueMessage JSON)
  ↓
URL resolver (id.shp.ee → canonical)
  ↓
product extractor (CloudflareBrowserRenderingAdapter)
  ↓
shop extractor (same)
  ↓
weight extractor (regex/AI from HTML)
  ↓
normalizer (shop status enum)
  ↓
scoring engine (calculateProductScore)
  ↓
risk analyzer (detectRisks)
  ↓
Mastra report workflow (RecommendationWriter + RiskAnalyzer + DataQualityAgent)
  ↓
D1 structured result (sh_comparisons, sh_comparisonItems, sh_aiReports)
  ↓
R2 raw artifacts (rawSnapshotR2Key, rawResponseR2Key)
  ↓
result page (apps/web/src/pages/ResultPage.tsx)
```

### Keyword Search Data Flow

```txt
Input keyword
  ↓
Zod validation
  ↓
research session row
  ↓
job row
  ↓
queue message
  ↓
loadSearchConfig (D1) → CLOUDFLARE_* env
  ↓
CloudflareBrowserRenderingAdapter.searchProducts
  → Renders Shopee search page
  → Cheerio extracts product URLs
  → Dedupe by shopId:itemId
  ↓
shippedFromFilter (DKI Jakarta)
  ↓
candidateEnrichmentJob (extractProduct + extractShop for each)
  ↓
topTenRanking (rank by finalScore)
  ↓
AI report (Mastra workflow)
  ↓
result page
```

## Data Quality Invariant

Every extracted field is represented as:
```ts
{ value: unknown | null; source: string | null; confidence: number }
```

Missing data stays missing — never inferred as fact. Per PRD §8.6.

## Folder Structure

```txt
shopee-product-research-ai/
  apps/
    web/
      src/
        app/             # router config (TanStack Router)
        pages/           # page components (Login, Register, Compare, Result, etc.)
        components/      # reusable components (AiReportView, RedFlagList, etc.)
        lib/             # apiRequest, schemas, helpers
        __tests__/       # PRD-compliance.test.ts, prd-resources.test.ts
      functions/
        _worker.js       # Pages Function: /api/* proxy + asset fallback
      scripts/
        copy-pages-function.mjs  # build-time copy of _worker.js
      package.json       # scripts: build, deploy:pages, test
      wrangler.toml

  workers/
    api/
      src/
        routes/         # auth, research, shopee, config, admin
        middleware/     # rateLimit
        lib/            # auth, errors, nineRouter
      wrangler.toml    # DB, LOGS, RESEARCH_QUEUE bindings

    queueConsumer/
      src/
        index.ts        # processQueueBatch, env spreading
      wrangler.toml    # queue consumer config

  packages/
    shared/
      src/
        types/          # ShopSnapshot, ProductSnapshot, etc.
        schemas/        # Zod schemas (researchSchema, queueMessageSchema)
        constants/      # enums.ts (jobStatus, shopStatus, aiModelUsageType, etc.)
        utils/          # responseParser, assertNever

    db/
      migrations/      # 0001_initial_schema.sql ... 0004_ai_reports_unique.sql
      src/
        repositories/   # products-shops-items, configs, aiReports, etc.
        aiResponseStorage.ts
        queue.ts
        r2.ts

    core/
      src/
        scoring/        # engine, breakdown, ranking
        risk/           # engine
        quality/        # data quality checker

    shopee/
      src/
        adapters/       # nineRouterFetchAdapter, browserRunAdapter, cloudflareBrowserRenderingAdapter
        resolver/       # urlParser, resolveUrl, webFetchAdapter, browserRunAdapter
        parser/         # productParser, shopParser, weightExtractor, featureExtractor
        contracts/      # products, shops Zod schemas
        extractors/     # mockExtractor, fallbackExtractor, snapshotStorage
        collectors/     # candidateCollector
        filters/        # shippedFromFilter
        jobs/           # candidateEnrichmentJob, topTenRanking
        fixtures/       # products, shops (test-only)

    ai/
      src/
        mastra/         # researchWorkflow.ts
        agents/         # recommendationWriter, riskAnalyzer, dataQualityAgent
        workflows/      # runner.ts
        nineRouter/     # client.ts (AI gateway via 9router)
        jobProcessor.ts # main entry point called by queue consumer
        retry.ts
        partialSuccess.ts

    auth/
      src/
        password.ts     # PBKDF2-SHA-256, 100000 iterations
        session.ts      # opaque session token, hash in D1
        validation.ts

  docs/
    prd.md              # immutable source of truth
    architecture.md
    api/api-contract.md
    database/           # schema, naming-rules, d1-strategy
    shared/enums.md
    ai-orchestration.md
    shopee/             # extraction-strategy, search-api-strategy, url-resolver, data-fields
    scoring/scoring-engine.md
    configuration/      # env-variables, runtime-configuration
    ui/configuration-crud.md
    deployment/checklist.md
    standards/          # coding, error, logging, security, testing
    tasks/              # backlog, done, failed, contract

  .ai/
    agent-instructions.md
    autopilot-system.md
```

## Rules

- `apps/web` cannot import from `workers`.
- `apps/web` can import `packages/shared` and `packages/core` only.
- `workers/api` and `workers/queueConsumer` can import `packages/*`.
- Shopee-specific logic must not exist outside `packages/shopee`.
- AI prompt logic must not exist outside `packages/ai`.
- Scoring logic must not exist outside `packages/core`.

## Pages Function vs Mastra Worker

- `apps/web/functions/_worker.js` is a Cloudflare Pages Function (not a separate Worker). It runs in the Pages deployment context and proxies `/api/*` to the API Worker.
- Mastra workflow is invoked **inside the queue consumer** (not a separate Worker). The `packages/ai` package exports `processJobSync()` which is called from `workers/queueConsumer/src/index.ts`.
- The `workers/mastra` path mentioned in earlier docs is **not deployed**. All AI workflow runs in the queue consumer for simpler infra.
# Implementation Stack

This document locks the implementation choices that were still ambiguous in the source-of-truth docs. Autopilot agents must follow this stack unless an ADR is approved by a human.

## Monorepo

- Package manager: `pnpm`.
- Workspace file: `pnpm-workspace.yaml`.
- Language: TypeScript only.
- TypeScript mode: strict.
- Module format: ESM.
- Shared code must live in `packages/*`.

## Frontend

- App location: `apps/web`.
- Framework: React + Vite.
- Routing: TanStack Router.
- Server state: TanStack Query.
- Forms: React Hook Form with Zod resolver.
- Styling: CSS Modules or plain CSS in `apps/web/src/styles`; do not introduce a UI framework unless an ADR approves it.
- Frontend imports only from `packages/shared`.

## Workers

- API Worker location: `workers/api`.
- Queue consumer location: `workers/queueConsumer`.
- Worker router: Hono.
- Validation: Zod at route boundary.
- Route handlers must call services; business logic must stay out of route handlers.
- Worker tests use Vitest with Miniflare-compatible mocks where needed.

## Database

- Database: Cloudflare D1 binding `DB`.
- Query style: prepared D1 statements through repository helpers in `packages/db`.
- ORM: none for MVP unless an ADR approves it.
- Migrations location: `packages/db/migrations`.
- Table names must start with `sh_`.
- Column names must use camelCase and must not contain underscores.

## Queue

- Queue producer binding name: `RESEARCH_QUEUE`.
- Queue consumer binding name: `RESEARCH_QUEUE`.
- Queue message schema must be defined in `packages/shared`.
- Heavy workflows must be accepted synchronously by API and processed asynchronously by the queue consumer.
- Local development may use a mock queue adapter when Cloudflare Queues are unavailable.

## R2

- R2 binding name: `LOGS`.
- Bucket name: `multi-apps-ai-bucket`.
- R2 helpers must live in `packages/db` or Worker service code, not in frontend.
- D1 stores only R2 keys and safe metadata.

## Testing

- Test runner: Vitest.
- Frontend component tests: Vitest + Testing Library.
- API/service tests: Vitest.
- Required scripts at root:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

## Code Quality

- Linting: ESLint.
- Formatting: Prettier.
- Build output, coverage, `.wrangler`, and generated artifacts must not be committed unless explicitly required by a task.

## Bootstrap Rule

Before `package.json` exists, only source-of-truth validation scripts are required to pass. After `TASK-010` creates the monorepo root package, every subsequent task must maintain the root scripts listed above.
# System Overview

## Architecture Summary

Shopee Product Research AI menggunakan Cloudflare sebagai backend utama.

```txt
Cloudflare Pages
→ React + Vite frontend

Cloudflare Workers
→ Backend API utama
→ Auth API
→ Research API
→ Job status API
→ Queue consumer
→ Mastra workflow runtime

Cloudflare D1
→ Structured database

Cloudflare R2
→ Raw HTML, raw JSON, screenshot, AI raw response besar

Cloudflare Queues
→ Async job processing

Cloudflare Browser Run
→ Browser fallback jika fetch biasa gagal

9router
→ AI model gateway

Optional VPS
→ Fallback scraper worker jika Cloudflare extraction tidak cukup
```

## Core Principles

1. Data first, AI second.
2. AI explains, scoring decides.
3. Heavy job must be async.
4. D1 stores structured data only.
5. R2 stores large raw artifacts.
6. Every extracted field has source and confidence.
7. Missing data must stay missing.
8. Shopee access must go through adapter layer.
9. Frontend must not call Shopee directly.
10. Route handler must not contain business logic.

## Main Runtime Components

| Component | Location | Responsibility |
|---|---|---|
| Web app | `apps/web` | UI, forms, result page, polling |
| API Worker | `workers/api` | Auth, research endpoints, product endpoints |
| Queue Worker | `workers/queueConsumer` | Background job processing |
| Mastra Worker | `workers/mastra` or `packages/ai` | Workflow orchestration |
| Shared packages | `packages/shared` | Types, Zod schemas, constants |
| Core packages | `packages/core` | Scoring, comparison, risk, normalization |
| Shopee packages | `packages/shopee` | URL resolver, extractor, parser adapters |
| DB package | `packages/db` | D1 migrations and query helpers |
| AI package | `packages/ai` | Mastra agents, prompts, 9router client |
# Technical Decisions — Shopee Product Research AI

Dokumen ini adalah keputusan teknis yang dikunci untuk MVP. AI agent tidak boleh mengubah keputusan ini tanpa membuat ADR baru dan mendapat approval.

| # | Keputusan | Pilihan Final | Impact |
|---:|---|---|---|
| 1 | Framework frontend | **React + Vite + TanStack Router + TanStack Query** | Menentukan seluruh `apps/web`. Aplikasi dibuat sebagai SPA yang memanggil Cloudflare Workers API. Tidak memakai SSR agar deployment Cloudflare lebih sederhana. |
| 2 | Package manager | **pnpm + pnpm workspace** | Menentukan monorepo setup, script lint/typecheck/test/build, dan dependency management lintas apps/packages. |
| 3 | ID generation strategy | **nanoid + entity prefix** | Semua entity memakai ID string prefixed, misalnya `usr_`, `ses_`, `rsr_`, `prd_`, `shp_`, `cmp_`, `job_`. ID dibuat di application layer, bukan auto increment. |
| 4 | Auth implementation | **Email/password + WebCrypto PBKDF2-SHA-256 + opaque session cookie** | Menentukan `TASK-017`. Password di-hash dengan salt unik dan iterasi configurable. Session memakai token acak, token disimpan sebagai hash di D1, cookie `shSession` HttpOnly/Secure/SameSite=Lax. |
| 5 | 9router configuration | **D1 runtime config with env secret/bootstrap fallback** | Menentukan `TASK-034` dan runtime configuration. Provider, base URL non-secret, model, timeout, dan retry policy dimuat dari D1 config tables. Environment variables hanya dipakai untuk secret values dan safe bootstrap fallback saat D1 belum memiliki config. |
| 6 | Job progress transport | **Polling, bukan WebSocket** | Menentukan frontend architecture. Frontend poll `GET /api/jobs/:id` dengan interval adaptif. WebSocket ditunda agar Cloudflare Worker, D1, dan Queue lebih sederhana. |
| 7 | Shopee search strategy | **Adapter-based extraction: official API jika tersedia, fallback scrape terbatas** | Menentukan `TASK-060–065`. Strategi urutan: official/affiliate API jika ada → fetch ringan → 9router web fetch → Browser Run → optional VPS scraper. Tidak login, tidak bypass CAPTCHA, tidak akses cart/checkout/order/user. |
| 8 | Validation library | **Zod** | Menentukan `packages/shared`. Semua request API, response extractor, output AI, dan contract internal divalidasi dengan Zod. |
| 9 | Backend utama | **Cloudflare Workers** | API utama, queue consumer, Mastra workflow ringan, dan endpoint job status berada di Cloudflare. |
| 10 | Database utama | **Cloudflare D1** | D1 menyimpan data structured. Raw HTML, raw JSON, screenshot, dan response AI besar masuk R2. |
| 11 | Queue | **Cloudflare Queues** | Semua job berat diproses async. Request utama hanya membuat research session dan job. |
| 12 | Object storage | **Cloudflare R2** | Menyimpan snapshot besar, raw response, dan debug artifact agar D1 tetap ringan. |
| 13 | AI orchestration | **Mastra** | Mastra mengatur workflow dan agent; scoring tetap deterministic di `packages/core`. |
| 14 | Database naming | **Table prefix `sh_`, column camelCase tanpa underscore** | Semua table wajib diawali `sh_`. Semua column **tidak boleh mengandung `_`**. Column menggunakan camelCase. |

## Locked Decisions

Keputusan di atas berlaku untuk semua task implementasi. Jika agent ingin mengubah salah satu keputusan, agent harus:

1. Membuat file ADR baru di `docs/adr`.
2. Menjelaskan alasan perubahan.
3. Menjelaskan dampak ke folder, API, database, dan testing.
4. Menunggu approval manusia sebelum coding.

## Additional Locked Decisions — Configuration and Providers

| # | Decision | Value | Impact |
|---:|---|---|---|
| 9 | Runtime configuration storage | D1 tables with frontend CRUD | Semua setting runtime harus dikelola via UI admin/settings dan tidak boleh di-hardcode. |
| 10 | Config table naming | Tables use `sh_` prefix, columns use camelCase | Menjaga konsistensi D1 schema. |
| 11 | Secret storage | Cloudflare secrets / CI secrets only | D1 hanya menyimpan `secretRef`, tidak menyimpan nilai token/API key. |
| 12 | Cloudflare D1 resource | Existing `multi_Ai_db` via binding `DB` | Tidak membuat database baru. |
| 13 | Cloudflare R2 resource | Existing `multi-apps-ai-bucket` via binding `LOGS` | Semua raw snapshot/log besar masuk bucket ini. |
| 14 | AI provider CRUD | Provider and model config editable from frontend | Admin bisa test provider/model dari UI. |
| 15 | Search provider CRUD | Search strategy editable from frontend | Strategy API/scrape/fallback bisa diganti tanpa redeploy. |

## Runtime Config Precedence

All runtime configuration must be loaded with this precedence:

1. Active D1 runtime configuration row.
2. Safe bootstrap environment default if no D1 row exists.
3. Built-in development fallback only when a task explicitly needs local bootstrap and the value is not a secret, not a production URL, not a provider model, and not a scoring weight.

Secrets are never loaded from D1 values. D1 stores only `secretRef`, and the Worker reads the secret value from `env[secretRef]`.

## Cloudflare Resource Decision

Use existing Cloudflare resources only for MVP:

```toml
account_id = "79dea2845a4b62ea5229c8676dea02c0"

[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"

[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"
```

API tokens must not be committed.
