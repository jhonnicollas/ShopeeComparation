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
