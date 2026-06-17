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
