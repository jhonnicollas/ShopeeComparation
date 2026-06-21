# API Contract

**Base URL:** `https://shopee-product-research-api.indiehomesungairaya.workers.dev` (production) — proxied from frontend at `https://shopee-product-research-web.pages.dev/api/*` via Pages Function.

All routes are mounted on the API Worker under `/api` prefix. Frontend calls `/api/*` which is rewritten by `apps/web/functions/_worker.js` to the API Worker.

## API Principles

- All API requests and responses must be validated with Zod (`packages/shared/src/schemas`).
- All field names use camelCase (PRD §7 #14).
- API must not expose internal stacktrace. Standard error shape below.
- All protected endpoints require session cookie (`shSession`, HttpOnly).
- Heavy operations return `202 Accepted` with `jobId` and `researchSessionId`, frontend polls status (PRD §7 #6 polling, not WebSocket).
- Enum values follow `docs/shared/enums.md` and `packages/shared/src/constants/enums.ts`.
- HTTP status codes: `200` OK, `202` Accepted (async), `400` bad input, `401` unauth, `403` forbidden, `404` not found, `409` conflict, `429` rate-limited, `500` internal.

## Standard Error Response

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Input is invalid.",
    "details": null
  }
}
```

Rules:

- `code` is one of `errorCode` enum values (`packages/shared/src/constants/enums.ts`).
- `message` is user-facing. Never contains stacktrace or secrets.
- `details` may contain safe validation field-level hints.

## Auth API

### POST /api/auth/register

Request:

```json
{ "email": "user@example.com", "password": "secretPassword123", "name": "Jhon" }
```

Response 200:

```json
{ "user": { "id": "usr_xxx", "email": "user@example.com", "name": "Jhon", "role": "user" } }
```

Sets `shSession` HttpOnly cookie.

### POST /api/auth/login

Request:

```json
{ "email": "user@example.com", "password": "secretPassword123" }
```

Response 200:

```json
{ "user": { "id": "usr_xxx", "email": "user@example.com", "role": "user" } }
```

### POST /api/auth/logout

Response 200: `{ "success": true }`. Revokes session in D1, clears cookie.

### GET /api/auth/me

Response 200:

```json
{ "user": { "id": "usr_xxx", "email": "user@example.com", "name": "Jhon", "role": "user" } }
```

Returns 401 if no valid session.

## Research API

### POST /api/research/compare-links

Request:

```json
{
  "links": [
    "https://id.shp.ee/kf239Muk",
    "https://shopee.co.id/product/1494940697/41104660407"
  ]
}
```

Response 202:

```json
{ "researchSessionId": "rsr_xxx", "jobId": "job_xxx", "status": "pending" }
```

Validation: 1–5 links (PRD §8.4). Dedupes duplicates. Rejects non-Shopee URLs. Accepts both full Shopee URLs and `id.shp.ee` short URLs.

### POST /api/research/keyword-search

Request:

```json
{
  "keyword": "tensimeter digital",
  "shippedFrom": "DKI Jakarta",
  "limit": 10,
  "priceMin": null,
  "priceMax": null,
  "minimumRating": null,
  "storeStatus": null
}
```

Response 202:

```json
{ "researchSessionId": "rsr_xxx", "jobId": "job_xxx", "status": "pending" }
```

Defaults: `shippedFrom="DKI Jakarta"`, `limit=10` (PRD §8.3).

### GET /api/research/

List research sessions for current user (most recent first).

Response 200:

```json
{
  "items": [
    {
      "id": "rsr_xxx",
      "mode": "compareLinks",
      "keyword": null,
      "status": "completed",
      "bestProductId": "prd_xxx",
      "createdAt": "2026-06-17T00:00:00.000Z"
    }
  ]
}
```

### GET /api/research/sessions/:id

Get a single research session by ID.

Response 200:

```json
{
  "researchSessionId": "rsr_xxx",
  "mode": "keywordSearch",
  "keyword": "tensimeter",
  "shippedFrom": "DKI Jakarta",
  "status": "completed",
  "bestProductId": "prd_xxx",
  "totalProducts": 5,
  "completedProducts": 5,
  "errorMessage": null
}
```

Returns 404 `SESSION_NOT_FOUND` if not found, 403 if not owner.

### GET /api/research/sessions/:id/status

Lightweight status endpoint for polling.

Response 200:

```json
{
  "id": "rsr_xxx",
  "status": "processing",
  "completedProducts": 3,
  "totalProducts": 5,
  "currentStep": "fetchingShop"
}
```

### GET /api/research/jobs/:id

Full job status.

Response 200:

```json
{
  "jobId": "job_xxx",
  "researchSessionId": "rsr_xxx",
  "type": "compareLinks",
  "status": "processing",
  "progressCurrent": 3,
  "progressTotal": 5,
  "currentStep": "extracting",
  "errorMessage": null
}
```

Job status enum: `pending | processing | completed | failed | partialSuccess` (PRD §Acceptance — Job Progress).

### GET /api/research/jobs/:id/logs

Response 200:

```json
{
  "items": [
    { "level": "info", "message": "Resolved short URL", "createdAt": "2026-06-17T00:00:00.000Z" }
  ]
}
```

### GET /api/research/comparisons/by-session/:sessionId

Returns the comparison + ranked items + product + shop details for a session.

Response 200:

```json
{
  "comparison": { "id": "cmp_xxx", "researchSessionId": "rsr_xxx", "bestProductId": "prd_xxx" },
  "items": [
    {
      "id": "cmpitm_xxx",
      "rank": 1,
      "productId": "prd_xxx",
      "shopId": "shp_xxx",
      "finalScore": 0.85,
      "ratingScore": 0.95,
      "reviewCountScore": 0.7,
      "soldCountScore": 0.8,
      "priceScore": 0.75,
      "shopTrustScore": 0.9,
      "responseRateScore": 0.95,
      "featureMatchScore": 0.6,
      "riskPenalty": 0,
      "prosJson": ["Tinggi rating", "Respon cepat"],
      "consJson": ["Harga di atas rata-rata"],
      "riskJson": []
    }
  ],
  "products": { "prd_xxx": { "id": "prd_xxx", "title": "...", "priceMin": 125000, "rating": 4.8, "weight": {...} } },
  "shops": { "shp_xxx": { "id": "shp_xxx", "name": "...", "primaryStatus": "MALL", "rating": 4.9, "statusJson": ["MALL"] } }
}
```

`statusJson` is parsed as `string[]` server-side; never raw JSON string.

### GET /api/research/comparisons/:comparisonId/ai-report

Response 200:

```json
{
  "report": {
    "bestProductId": "prd_xxx",
    "bestProductName": "...",
    "ranking": [{ "productId": "prd_xxx", "rank": 1, "reason": "..." }],
    "valueForMoneyProductId": "prd_xxx",
    "safestProductId": "prd_xxx",
    "riskiestProductId": "prd_yyy",
    "prosCons": [{ "productId": "prd_xxx", "pros": ["..."], "cons": ["..."] }],
    "redFlags": [],
    "confidence": 0.85,
    "missingDataNotes": ["product weight not found"]
  },
  "rawText": null
}
```

AI output is Zod-validated against the report schema before persistence (PRD §8.10).

### GET /api/research/products/:id

Single product by internal ID.

### GET /api/research/shops/:id

Single shop by internal ID. Returns shop with `statusJson` parsed as `string[]`.

## Shopee API

### POST /api/shopee/resolve-url

Request:

```json
{ "url": "https://id.shp.ee/kf239Muk" }
```

Response 200:

```json
{
  "originalUrl": "https://id.shp.ee/kf239Muk",
  "finalUrl": "https://shopee.co.id/product/1494940697/41104660407?d_id=f0ca1",
  "canonicalUrl": "https://shopee.co.id/product/1494940697/41104660407",
  "shopId": "1494940697",
  "itemId": "41104660407",
  "resolveMethod": "redirect",
  "status": "resolved"
}
```

`resolveMethod` enum: `direct | redirect | webFetch | browserRun | manual`. `status`: `resolved | failed`. On failure, `errorMessage` field is set and IDs are null (PRD §8.5 — never crash on URL failure).

## Configuration API

Configuration APIs require admin role. CRUD endpoints under `/api/admin/configs/*`:

```
GET    /api/admin/configs/apps
POST   /api/admin/configs/apps
GET    /api/admin/configs/apps/:id
PATCH  /api/admin/configs/apps/:id
DELETE /api/admin/configs/apps/:id

GET    /api/admin/configs/ai-providers
POST   /api/admin/configs/ai-providers
GET    /api/admin/configs/ai-providers/:id
PATCH  /api/admin/configs/ai-providers/:id
DELETE /api/admin/configs/ai-providers/:id
POST   /api/admin/configs/ai-providers/:id/test

GET    /api/admin/configs/ai-models
POST   /api/admin/configs/ai-models
GET    /api/admin/configs/ai-models/:id
PATCH  /api/admin/configs/ai-models/:id
DELETE /api/admin/configs/ai-models/:id
POST   /api/admin/configs/ai-models/:id/test

GET    /api/admin/configs/search-providers
POST   /api/admin/configs/search-providers
GET    /api/admin/configs/search-providers/:id
PATCH  /api/admin/configs/search-providers/:id
DELETE /api/admin/configs/search-providers/:id
POST   /api/admin/configs/search-providers/:id/test

GET    /api/admin/configs/scoring
POST   /api/admin/configs/scoring
GET    /api/admin/configs/scoring/:id
PATCH  /api/admin/configs/scoring/:id
DELETE /api/admin/configs/scoring/:id
```

## Public Runtime Config API

```
GET /api/config/public         (no auth)
GET /api/config/apps/public    (no auth)
```

These endpoints must NOT return secrets or `secretRef` values. Only safe public config (e.g. `app.defaultShippedFrom`, `app.maxCompareLinks`).

## AI Model Test

Request:

```json
{ "testPrompt": "Return JSON only: {\"ok\": true}", "expectJson": true }
```

Response:

```json
{
  "status": "success",
  "latencyMs": 1234,
  "outputValidJson": true,
  "message": "Model test succeeded"
}
```

## Admin Jobs

```
GET /api/admin/jobs            (list all jobs)
GET /api/admin/jobs/:id        (single job)
GET /api/admin/jobs/:id/logs   (job logs)
```

Requires admin role.

## Pages Function Proxy

`apps/web/functions/_worker.js` runs in Cloudflare Pages. It:

- Proxies `https://shopee-product-research-web.pages.dev/api/*` → `https://shopee-product-research-api.indiehomesungairaya.workers.dev/api/*`
- Adds `Access-Control-Allow-Origin: https://shopee-product-research-web.pages.dev` to all responses
- Strips `Host` header and sets `Origin: https://shopee-product-research-web.pages.dev` on upstream requests
- Serves static assets from the Pages deployment via `env.ASSETS.fetch(request)`
- Sets `Cache-Control: no-store, no-cache, must-revalidate` on all responses (PRD-friendly: frontend never sees stale API responses)

Without this Pages Function, the deployed frontend has no `/api/*` proxy and returns 404 on any API call.
