# Database Schema — Cloudflare D1

## Naming Rules

- Semua table wajib diawali prefix `sh_`.
- Semua column wajib menggunakan camelCase.
- Nama column tidak boleh mengandung underscore.
- ID menggunakan prefixed nanoid string.
- Timestamp disimpan sebagai ISO string UTC.
- Raw data besar tidak boleh disimpan di D1; gunakan R2.

## Field Evidence Strategy

Scalar product and shop columns store normalized values for querying and display. Per-field source, confidence, and availability status are stored in `sh_fieldEvidence`.

Rules:

- Every extracted product, shop, weight, and feature field should have one evidence row when possible.
- Missing fields use `valueText = null`, `confidence = 0`, and `status = 'unavailable'`.
- Large raw values are not stored in `valueText`; store the raw artifact in R2 and reference it through `rawSnapshotR2Key` or `rawResponseR2Key`.
- `fieldName` must match the normalized field name, for example `priceMin`, `rating`, `responseRate`, or `value`.

## Tables

### sh_users

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `usr_xxx` |
| email | TEXT NOT NULL UNIQUE | User email |
| passwordHash | TEXT NOT NULL | Password hash |
| passwordSalt | TEXT NOT NULL | Password salt |
| name | TEXT | Display name |
| role | TEXT NOT NULL | `user` or `admin` |
| status | TEXT NOT NULL | `active`, `disabled` |
| createdAt | TEXT NOT NULL | ISO timestamp |
| updatedAt | TEXT NOT NULL | ISO timestamp |

### sh_sessions

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `ses_xxx` |
| userId | TEXT NOT NULL | FK to sh_users.id |
| tokenHash | TEXT NOT NULL UNIQUE | Hash of session token |
| userAgentHash | TEXT | Optional privacy-preserving user agent hash |
| ipHash | TEXT | Optional privacy-preserving IP hash |
| expiresAt | TEXT NOT NULL | Expiry timestamp |
| createdAt | TEXT NOT NULL | Created timestamp |
| revokedAt | TEXT | Revoked timestamp |

### sh_researchSessions

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `rsr_xxx` |
| userId | TEXT NOT NULL | Owner |
| mode | TEXT NOT NULL | `keywordSearch` or `compareLinks` |
| keyword | TEXT | Search keyword |
| shippedFrom | TEXT | Default `DKI Jakarta` |
| status | TEXT NOT NULL | Job status |
| bestProductId | TEXT | Best product |
| totalProducts | INTEGER NOT NULL DEFAULT 0 | Total products |
| completedProducts | INTEGER NOT NULL DEFAULT 0 | Completed products |
| errorMessage | TEXT | Public error message |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_resolvedUrls

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `url_xxx` |
| userId | TEXT NOT NULL | Owner |
| originalUrl | TEXT NOT NULL | User input URL |
| finalUrl | TEXT | Redirect final URL |
| canonicalUrl | TEXT | Normalized product URL |
| shopId | TEXT | Shopee shop ID |
| itemId | TEXT | Shopee item ID |
| resolveMethod | TEXT | `redirect`, `webFetch`, `browserRun`, `manual` |
| status | TEXT NOT NULL | `resolved`, `failed` |
| errorMessage | TEXT | Error if failed |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_products

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `prd_xxx` |
| shopeeItemId | TEXT | Shopee item ID |
| shopeeShopId | TEXT | Shopee shop ID |
| title | TEXT | Product title |
| brand | TEXT | Brand |
| category | TEXT | Category |
| originalUrl | TEXT | Input URL |
| canonicalUrl | TEXT | Normalized URL |
| imageUrl | TEXT | Main image |
| galleryJson | TEXT | JSON array |
| videoUrl | TEXT | Video URL if any |
| priceMin | INTEGER | Price in IDR |
| priceMax | INTEGER | Price in IDR |
| priceBeforeDiscount | INTEGER | Before discount |
| discountText | TEXT | Discount label |
| rating | REAL | Product rating |
| reviewCount | INTEGER | Total reviews |
| soldCount | INTEGER | Total sold |
| favoriteCount | INTEGER | Total favorite |
| stock | INTEGER | Stock if available |
| shippedFrom | TEXT | Shipping origin |
| description | TEXT | Product description short/cleaned |
| specificationJson | TEXT | Structured spec JSON |
| variationJson | TEXT | Variation JSON |
| confidenceScore | REAL NOT NULL DEFAULT 0 | Extraction confidence |
| rawSnapshotR2Key | TEXT | R2 key |
| lastCheckedAt | TEXT | Last extraction time |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_productWeights

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `wgt_xxx` |
| productId | TEXT NOT NULL | FK to sh_products.id |
| value | REAL | Weight value |
| unit | TEXT | `gram`, `kg`, or null |
| rawText | TEXT | Raw text source |
| source | TEXT | Source name |
| confidence | REAL NOT NULL DEFAULT 0 | Confidence |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_shops

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `shp_xxx` |
| shopeeShopId | TEXT UNIQUE | Shopee shop ID |
| name | TEXT | Shop name |
| shopUrl | TEXT | Shop URL |
| statusJson | TEXT | JSON labels |
| primaryStatus | TEXT | `MALL`, `OFFICIAL`, `STAR`, `STARPLUS`, `PREFERRED`, `REGULAR`, `UNKNOWN` |
| rating | REAL | Shop rating |
| ratingCount | INTEGER | Rating count |
| responseRate | REAL | Response rate percentage |
| responseTime | TEXT | Response time text |
| followerCount | INTEGER | Followers |
| productCount | INTEGER | Total products |
| joinedAgeText | TEXT | Joined age text |
| location | TEXT | Shop location |
| confidenceScore | REAL NOT NULL DEFAULT 0 | Extraction confidence |
| rawSnapshotR2Key | TEXT | R2 key |
| lastCheckedAt | TEXT | Last checked time |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_productFeatures

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `fea_xxx` |
| productId | TEXT NOT NULL | FK to sh_products.id |
| name | TEXT NOT NULL | Feature name |
| value | TEXT | Feature value |
| source | TEXT | Extraction source |
| confidence | REAL NOT NULL DEFAULT 0 | Confidence |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_comparisons

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `cmp_xxx` |
| researchSessionId | TEXT NOT NULL | FK to sh_researchSessions.id |
| userId | TEXT NOT NULL | Owner |
| title | TEXT | Comparison title |
| mode | TEXT NOT NULL | Mode |
| keyword | TEXT | Keyword |
| shippedFrom | TEXT | Shipping filter |
| bestProductId | TEXT | Best product |
| summary | TEXT | Short summary |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_comparisonItems

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `cim_xxx` |
| comparisonId | TEXT NOT NULL | FK to sh_comparisons.id |
| productId | TEXT NOT NULL | FK to sh_products.id |
| shopId | TEXT | FK to sh_shops.id |
| rank | INTEGER | Ranking |
| finalScore | REAL NOT NULL DEFAULT 0 | Final score |
| ratingScore | REAL NOT NULL DEFAULT 0 | Rating component |
| reviewCountScore | REAL NOT NULL DEFAULT 0 | Review component |
| soldCountScore | REAL NOT NULL DEFAULT 0 | Sold component |
| priceScore | REAL NOT NULL DEFAULT 0 | Price component |
| shopTrustScore | REAL NOT NULL DEFAULT 0 | Shop trust component |
| responseRateScore | REAL NOT NULL DEFAULT 0 | Response component |
| featureMatchScore | REAL NOT NULL DEFAULT 0 | Feature component |
| riskPenalty | REAL NOT NULL DEFAULT 0 | Risk penalty |
| prosJson | TEXT | Pros JSON |
| consJson | TEXT | Cons JSON |
| riskJson | TEXT | Risk JSON |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_aiReports

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `air_xxx` |
| comparisonId | TEXT NOT NULL | FK to comparison |
| userId | TEXT NOT NULL | Owner |
| model | TEXT | Model name |
| provider | TEXT | Provider name |
| promptVersion | TEXT | Prompt version |
| reportJson | TEXT | Structured report |
| reportText | TEXT | Rendered report |
| confidence | REAL NOT NULL DEFAULT 0 | AI confidence |
| rawResponseR2Key | TEXT | Raw response in R2 |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_jobs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `job_xxx` |
| userId | TEXT NOT NULL | Owner |
| researchSessionId | TEXT | Related research session |
| type | TEXT NOT NULL | Job type |
| status | TEXT NOT NULL | Job status |
| progressCurrent | INTEGER NOT NULL DEFAULT 0 | Current progress |
| progressTotal | INTEGER NOT NULL DEFAULT 0 | Total progress |
| currentStep | TEXT | Current step |
| payloadJson | TEXT | Job payload |
| errorMessage | TEXT | Public error |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_jobLogs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `log_xxx` |
| jobId | TEXT NOT NULL | FK to sh_jobs.id |
| level | TEXT NOT NULL | `info`, `warn`, `error` |
| message | TEXT NOT NULL | Log message |
| metadataJson | TEXT | Structured metadata |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_rawSnapshots

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `raw_xxx` |
| ownerType | TEXT NOT NULL | product, shop, ai, resolver |
| ownerId | TEXT NOT NULL | Related entity ID |
| r2Key | TEXT NOT NULL | R2 object key |
| contentType | TEXT | MIME/content type |
| sizeBytes | INTEGER | Size in bytes |
| createdAt | TEXT NOT NULL | Created timestamp |

### sh_fieldEvidence

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `evd_xxx` |
| ownerType | TEXT NOT NULL | `product`, `shop`, `weight`, `feature`, `resolver`, `report` |
| ownerId | TEXT NOT NULL | Related entity ID |
| fieldName | TEXT NOT NULL | Field name in camelCase |
| valueText | TEXT | Short normalized value as text if safe |
| source | TEXT | Source name, adapter, or document section |
| confidence | REAL NOT NULL DEFAULT 0 | 0 to 1 |
| status | TEXT NOT NULL | `available`, `unavailable`, `partial` |
| rawSnapshotR2Key | TEXT | Optional R2 raw artifact key |
| createdAt | TEXT NOT NULL | Created timestamp |


### sh_appConfigs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `cfg_xxx` |
| key | TEXT NOT NULL UNIQUE | Config key, camelCase |
| value | TEXT | Config value as string or JSON |
| valueType | TEXT NOT NULL | `string`, `number`, `boolean`, `json` |
| category | TEXT NOT NULL | Config category |
| description | TEXT | Human-readable explanation |
| isPublic | INTEGER NOT NULL DEFAULT 0 | 1 if safe for frontend public config |
| isEnabled | INTEGER NOT NULL DEFAULT 1 | Enable flag |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_aiProviderConfigs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `aip_xxx` |
| providerKey | TEXT NOT NULL UNIQUE | Example `9router` |
| displayName | TEXT NOT NULL | Provider display name |
| baseUrl | TEXT NOT NULL | Provider base URL |
| authType | TEXT NOT NULL | `bearer`, `apiKey`, `none` |
| secretRef | TEXT | Secret reference name, not secret value |
| timeoutMs | INTEGER NOT NULL DEFAULT 60000 | Request timeout |
| retryCount | INTEGER NOT NULL DEFAULT 1 | Retry count |
| isEnabled | INTEGER NOT NULL DEFAULT 1 | Enable flag |
| lastTestStatus | TEXT | `success`, `failed`, `untested` |
| lastTestAt | TEXT | Last test timestamp |
| lastTestMessage | TEXT | Last test message |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_aiModelConfigs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `aim_xxx` |
| providerKey | TEXT NOT NULL | FK-like provider key |
| modelKey | TEXT NOT NULL | `primary`, `fast`, `fallback`, or custom |
| modelName | TEXT NOT NULL | Actual model identifier used by provider |
| displayName | TEXT | Display name |
| usageType | TEXT NOT NULL | `reasoning`, `extraction`, `fallback`, `vision`, `test` |
| contextWindow | INTEGER | Context window if known |
| supportsJson | INTEGER NOT NULL DEFAULT 0 | JSON mode support |
| supportsTools | INTEGER NOT NULL DEFAULT 0 | Tool support |
| supportsVision | INTEGER NOT NULL DEFAULT 0 | Vision support |
| costInput | REAL | Optional cost input |
| costOutput | REAL | Optional cost output |
| isDefault | INTEGER NOT NULL DEFAULT 0 | Default model for usage type |
| isEnabled | INTEGER NOT NULL DEFAULT 1 | Enable flag |
| lastTestStatus | TEXT | `success`, `failed`, `untested` |
| lastTestAt | TEXT | Last test timestamp |
| lastTestMessage | TEXT | Last test message |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_searchProviderConfigs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `srp_xxx` |
| providerKey | TEXT NOT NULL UNIQUE | Provider key |
| displayName | TEXT NOT NULL | Display name |
| providerType | TEXT NOT NULL | `officialApi`, `webFetch`, `browserRun`, `vpsScraper`, `manual` |
| priority | INTEGER NOT NULL DEFAULT 100 | Lower number means earlier provider |
| baseUrl | TEXT | Base URL if applicable |
| authType | TEXT NOT NULL DEFAULT 'none' | Auth type |
| secretRef | TEXT | Secret reference, not secret value |
| timeoutMs | INTEGER NOT NULL DEFAULT 60000 | Timeout |
| retryCount | INTEGER NOT NULL DEFAULT 1 | Retry count |
| isEnabled | INTEGER NOT NULL DEFAULT 1 | Enable flag |
| lastTestStatus | TEXT | Test status |
| lastTestAt | TEXT | Last test timestamp |
| lastTestMessage | TEXT | Last test message |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

### sh_scoringConfigs

| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | Example `sco_xxx` |
| configKey | TEXT NOT NULL UNIQUE | Scoring config key |
| displayName | TEXT NOT NULL | Display name |
| category | TEXT NOT NULL DEFAULT 'default' | Product category or default |
| weightsJson | TEXT NOT NULL | JSON scoring weights |
| isDefault | INTEGER NOT NULL DEFAULT 0 | Default config |
| isEnabled | INTEGER NOT NULL DEFAULT 1 | Enable flag |
| createdAt | TEXT NOT NULL | Created timestamp |
| updatedAt | TEXT NOT NULL | Updated timestamp |

## SQL Draft

```sql
CREATE TABLE IF NOT EXISTS sh_users (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "passwordSalt" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_sessions (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userAgentHash" TEXT,
  "ipHash" TEXT,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "revokedAt" TEXT
);

CREATE TABLE IF NOT EXISTS sh_researchSessions (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "keyword" TEXT,
  "shippedFrom" TEXT,
  "status" TEXT NOT NULL,
  "bestProductId" TEXT,
  "totalProducts" INTEGER NOT NULL DEFAULT 0,
  "completedProducts" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_resolvedUrls (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "finalUrl" TEXT,
  "canonicalUrl" TEXT,
  "shopId" TEXT,
  "itemId" TEXT,
  "resolveMethod" TEXT,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_products (
  "id" TEXT PRIMARY KEY,
  "shopeeItemId" TEXT,
  "shopeeShopId" TEXT,
  "title" TEXT,
  "brand" TEXT,
  "category" TEXT,
  "originalUrl" TEXT,
  "canonicalUrl" TEXT,
  "imageUrl" TEXT,
  "galleryJson" TEXT,
  "videoUrl" TEXT,
  "priceMin" INTEGER,
  "priceMax" INTEGER,
  "priceBeforeDiscount" INTEGER,
  "discountText" TEXT,
  "rating" REAL,
  "reviewCount" INTEGER,
  "soldCount" INTEGER,
  "favoriteCount" INTEGER,
  "stock" INTEGER,
  "shippedFrom" TEXT,
  "description" TEXT,
  "specificationJson" TEXT,
  "variationJson" TEXT,
  "confidenceScore" REAL NOT NULL DEFAULT 0,
  "rawSnapshotR2Key" TEXT,
  "lastCheckedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_productWeights (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "value" REAL,
  "unit" TEXT,
  "rawText" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_shops (
  "id" TEXT PRIMARY KEY,
  "shopeeShopId" TEXT UNIQUE,
  "name" TEXT,
  "shopUrl" TEXT,
  "statusJson" TEXT,
  "primaryStatus" TEXT,
  "rating" REAL,
  "ratingCount" INTEGER,
  "responseRate" REAL,
  "responseTime" TEXT,
  "followerCount" INTEGER,
  "productCount" INTEGER,
  "joinedAgeText" TEXT,
  "location" TEXT,
  "confidenceScore" REAL NOT NULL DEFAULT 0,
  "rawSnapshotR2Key" TEXT,
  "lastCheckedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_productFeatures (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_comparisons (
  "id" TEXT PRIMARY KEY,
  "researchSessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "mode" TEXT NOT NULL,
  "keyword" TEXT,
  "shippedFrom" TEXT,
  "bestProductId" TEXT,
  "summary" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_comparisonItems (
  "id" TEXT PRIMARY KEY,
  "comparisonId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "shopId" TEXT,
  "rank" INTEGER,
  "finalScore" REAL NOT NULL DEFAULT 0,
  "ratingScore" REAL NOT NULL DEFAULT 0,
  "reviewCountScore" REAL NOT NULL DEFAULT 0,
  "soldCountScore" REAL NOT NULL DEFAULT 0,
  "priceScore" REAL NOT NULL DEFAULT 0,
  "shopTrustScore" REAL NOT NULL DEFAULT 0,
  "responseRateScore" REAL NOT NULL DEFAULT 0,
  "featureMatchScore" REAL NOT NULL DEFAULT 0,
  "riskPenalty" REAL NOT NULL DEFAULT 0,
  "prosJson" TEXT,
  "consJson" TEXT,
  "riskJson" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_aiReports (
  "id" TEXT PRIMARY KEY,
  "comparisonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "model" TEXT,
  "provider" TEXT,
  "promptVersion" TEXT,
  "reportJson" TEXT,
  "reportText" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "rawResponseR2Key" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_jobs (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "researchSessionId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "progressCurrent" INTEGER NOT NULL DEFAULT 0,
  "progressTotal" INTEGER NOT NULL DEFAULT 0,
  "currentStep" TEXT,
  "payloadJson" TEXT,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_jobLogs (
  "id" TEXT PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_rawSnapshots (
  "id" TEXT PRIMARY KEY,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "r2Key" TEXT NOT NULL,
  "contentType" TEXT,
  "sizeBytes" INTEGER,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_fieldEvidence (
  "id" TEXT PRIMARY KEY,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "valueText" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "rawSnapshotR2Key" TEXT,
  "createdAt" TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS sh_appConfigs (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT,
  "valueType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_aiProviderConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "authType" TEXT NOT NULL,
  "secretRef" TEXT,
  "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
  "retryCount" INTEGER NOT NULL DEFAULT 1,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_aiModelConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL,
  "modelKey" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "displayName" TEXT,
  "usageType" TEXT NOT NULL,
  "contextWindow" INTEGER,
  "supportsJson" INTEGER NOT NULL DEFAULT 0,
  "supportsTools" INTEGER NOT NULL DEFAULT 0,
  "supportsVision" INTEGER NOT NULL DEFAULT 0,
  "costInput" REAL,
  "costOutput" REAL,
  "isDefault" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_searchProviderConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "providerType" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "baseUrl" TEXT,
  "authType" TEXT NOT NULL DEFAULT 'none',
  "secretRef" TEXT,
  "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
  "retryCount" INTEGER NOT NULL DEFAULT 1,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_scoringConfigs (
  "id" TEXT PRIMARY KEY,
  "configKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'default',
  "weightsJson" TEXT NOT NULL,
  "isDefault" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

```
