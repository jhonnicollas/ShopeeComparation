# Cloudflare Architecture

## Cloudflare Services

| Service | Usage |
|---|---|
| Cloudflare Pages | Host React + Vite frontend |
| Cloudflare Workers | Backend API and queue consumers |
| Cloudflare D1 | Structured relational data |
| Cloudflare R2 | Raw snapshots and large artifacts |
| Cloudflare Queues | Async job execution |
| Cloudflare Browser Run | Optional browser rendering fallback |

## Request Flow

### Compare Links

```txt
User submits 1–5 links
→ API Worker validates auth and input
→ API Worker creates sh_researchSessions row
→ API Worker creates sh_jobs row
→ API Worker sends message to Cloudflare Queues
→ Queue Consumer runs Mastra workflow
→ Workflow resolves URLs and extracts data
→ Structured data saved to D1
→ Raw artifacts saved to R2
→ AI report generated via 9router
→ Job marked completed or partialSuccess
→ Frontend polls job status and displays result
```

### Keyword Search

```txt
User submits keyword
→ API Worker validates auth and input
→ API Worker creates research session and job
→ Queue Consumer executes keyword workflow
→ Shopee search adapter collects candidates
→ Candidates filtered by DKI Jakarta
→ Product and shop data enriched
→ Scoring engine ranks top 10
→ Mastra generates AI report
→ Result saved to D1/R2
```

## Runtime Boundaries

Frontend must only call internal API.

API Worker must not contain parsing logic. It calls services.

Shopee extraction must live in `packages/shopee`.

Scoring must live in `packages/core`.

AI prompt and workflow must live in `packages/ai`.
# Data Flow

## Compare Links Data Flow

```txt
Input links
→ Zod validation
→ research session row
→ job row
→ queue message
→ URL resolver
→ product extractor
→ shop extractor
→ weight extractor
→ normalizer
→ scoring engine
→ risk analyzer
→ Mastra report workflow
→ D1 structured result
→ R2 raw artifacts
→ result page
```

## Keyword Search Data Flow

```txt
Input keyword
→ Zod validation
→ research session row
→ job row
→ queue message
→ query planner
→ search adapter
→ candidate collector
→ DKI Jakarta filter
→ product enrichment
→ shop enrichment
→ weight extraction
→ scoring
→ top 10 ranking
→ AI report
→ result page
```

## Data Quality Flow

Every extracted field must be represented as:

```ts
{
  value: unknown | null;
  source: string | null;
  confidence: number;
  status: "available" | "unavailable" | "partial";
}
```

Missing data must not be inferred as fact.
# Folder Structure

```txt
shopee-product-research-ai/
  apps/
    web/
      src/
        app/
        pages/
        components/
        features/
        lib/
      package.json

  workers/
    api/
      src/
      wrangler.toml

    queueConsumer/
      src/
      wrangler.toml

    mastra/
      src/
      wrangler.toml

  packages/
    shared/
      src/
        types/
        schemas/
        constants/
        utils/

    db/
      migrations/
      src/
        queries/
        repositories/

    core/
      src/
        scoring/
        comparison/
        normalization/
        risk/

    shopee/
      src/
        resolver/
        extractor/
        parser/
        adapters/
        fixtures/

    ai/
      src/
        mastra/
        agents/
        workflows/
        prompts/
        9router/

  docs/
  .ai/
```

## Rules

- `apps/web` cannot import from `workers`.
- `apps/web` can import `packages/shared` only.
- `workers/api` can import `packages/shared`, `packages/db`, `packages/core`, `packages/shopee`, and `packages/ai`.
- Shopee-specific logic must not exist outside `packages/shopee`.
- AI prompt logic must not exist outside `packages/ai`.
- Scoring logic must not exist outside `packages/core`.
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
