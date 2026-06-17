# API Contract

## API Principles

- All API requests and responses must be validated with Zod.
- All field names use camelCase.
- API must not expose internal stacktrace.
- All protected endpoints require session cookie.
- Heavy operations must return jobId, not wait synchronously.

## Auth API

### POST /api/auth/register

Request:

```json
{
  "email": "user@example.com",
  "password": "secretPassword",
  "name": "Jhon"
}
```

Response:

```json
{
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "name": "Jhon",
    "role": "user"
  }
}
```

### POST /api/auth/login

Request:

```json
{
  "email": "user@example.com",
  "password": "secretPassword"
}
```

Response:

```json
{
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### POST /api/auth/logout

Response:

```json
{
  "success": true
}
```

### GET /api/auth/me

Response:

```json
{
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "name": "Jhon",
    "role": "user"
  }
}
```

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

Response:

```json
{
  "researchSessionId": "rsr_xxx",
  "jobId": "job_xxx",
  "status": "pending"
}
```

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

Response:

```json
{
  "researchSessionId": "rsr_xxx",
  "jobId": "job_xxx",
  "status": "pending"
}
```

### GET /api/research

Response:

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

### GET /api/research/:id

Response:

```json
{
  "researchSession": {},
  "comparison": {},
  "items": [],
  "report": {}
}
```

### GET /api/research/:id/status

Response:

```json
{
  "id": "rsr_xxx",
  "status": "processing",
  "completedProducts": 3,
  "totalProducts": 5,
  "currentStep": "fetchingShop"
}
```

## Shopee API

### POST /api/shopee/resolve-url

Request:

```json
{
  "url": "https://id.shp.ee/kf239Muk"
}
```

Response:

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

## Jobs API

### GET /api/jobs/:id

Response:

```json
{
  "id": "job_xxx",
  "status": "processing",
  "progressCurrent": 3,
  "progressTotal": 5,
  "currentStep": "fetchingProduct",
  "errorMessage": null
}
```

### GET /api/jobs/:id/logs

Response:

```json
{
  "items": [
    {
      "level": "info",
      "message": "Resolved short URL",
      "createdAt": "2026-06-17T00:00:00.000Z"
    }
  ]
}
```

## Configuration API

Configuration APIs are admin-only unless stated otherwise.

### App Configs

```txt
GET    /api/admin/configs/app
POST   /api/admin/configs/app
GET    /api/admin/configs/app/:id
PATCH  /api/admin/configs/app/:id
DELETE /api/admin/configs/app/:id
```

### AI Provider Configs

```txt
GET    /api/admin/configs/ai-providers
POST   /api/admin/configs/ai-providers
GET    /api/admin/configs/ai-providers/:id
PATCH  /api/admin/configs/ai-providers/:id
DELETE /api/admin/configs/ai-providers/:id
POST   /api/admin/configs/ai-providers/:id/test
```

### AI Model Configs

```txt
GET    /api/admin/configs/ai-models
POST   /api/admin/configs/ai-models
GET    /api/admin/configs/ai-models/:id
PATCH  /api/admin/configs/ai-models/:id
DELETE /api/admin/configs/ai-models/:id
POST   /api/admin/configs/ai-models/:id/test
```

### Search Provider Configs

```txt
GET    /api/admin/configs/search-providers
POST   /api/admin/configs/search-providers
GET    /api/admin/configs/search-providers/:id
PATCH  /api/admin/configs/search-providers/:id
DELETE /api/admin/configs/search-providers/:id
POST   /api/admin/configs/search-providers/:id/test
```

### Scoring Configs

```txt
GET    /api/admin/configs/scoring
POST   /api/admin/configs/scoring
GET    /api/admin/configs/scoring/:id
PATCH  /api/admin/configs/scoring/:id
DELETE /api/admin/configs/scoring/:id
```

## Public Runtime Config API

Frontend may read safe public config only.

```txt
GET /api/config/public
```

This endpoint must not return secrets or `secretRef` values.

## AI Model Test Request

```json
{
  "testPrompt": "Return JSON only: {\"ok\": true}",
  "expectJson": true
}
```

## AI Model Test Response

```json
{
  "status": "success",
  "latencyMs": 1234,
  "outputValidJson": true,
  "message": "Model test succeeded"
}
```
