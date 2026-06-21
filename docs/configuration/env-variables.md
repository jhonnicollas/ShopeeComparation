# Environment Variables and Cloudflare Bindings

## Purpose

Source of truth for environment variable, Cloudflare binding, D1 database, R2 bucket, dan aturan penyimpanan secret.

## Security Rule (PRD §Runtime Configuration)

Token, API key, password, dan secret value **tidak boleh** di-hardcode di:
- Source code (`apps/`, `workers/`, `packages/`)
- Markdown documentation
- SQL migrations
- Frontend bundle (Vite build output)
- D1 row values

D1 only stores `secretRef` (e.g. `NINEROUTER_API_KEY`), not the actual value. The Worker reads the secret via `env[secretRef]` at request time.

## Cloudflare Account

| Key | Value | Notes |
|---|---|---|
| `account_id` | `79dea2845a4b62ea5229c8676dea02c0` | PRD-locked |
| API token | `<set-via-secret>` | Set via `wrangler secret put` only. Never commit. Rotate immediately if exposed. |

## Required Cloudflare D1 Binding (PRD §Cloudflare Resource)

```toml
[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"
```

No new D1 database is permitted for MVP. The application must use this exact resource.

## Required Cloudflare R2 Binding

```toml
[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"
```

All raw snapshots, raw AI responses, and large artifacts go here. D1 stores only the R2 key reference (e.g. `sh_rawSnapshots.r2Key`, `sh_aiReports.rawResponseR2Key`).

## Required Cloudflare Queue

```toml
[[queues.producers]]
binding = "RESEARCH_QUEUE"
queue = "shopee-research-queue"

[[queues.consumers]]  # in queueConsumer/wrangler.toml
queue = "shopee-research-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "shopee-research-dlq"
```

## Wrangler Configurations

### `workers/api/wrangler.toml`

```toml
name = "shopee-product-research-api"
main = "src/index.ts"
compatibility_date = "2026-06-17"
compatibility_flags = ["nodejs_compat"]
account_id = "79dea2845a4b62ea5229c8676dea02c0"

[vars]
APP_ENV = "production"
APP_NAME = "Shopee Product Research AI"
APP_BASE_URL = ""
JOB_POLL_INTERVAL_MS = "3000"
MAX_COMPARE_LINKS = "5"
KEYWORD_SEARCH_LIMIT = "10"
DEFAULT_SHIPPED_FROM = "DKI Jakarta"

[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"

[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"

[[queues.producers]]
binding = "RESEARCH_QUEUE"
queue = "shopee-research-queue"
```

### `workers/queueConsumer/wrangler.toml`

```toml
name = "shopee-product-research-queue-consumer"
main = "src/index.ts"
compatibility_date = "2026-06-17"
compatibility_flags = ["nodejs_compat"]
account_id = "79dea2845a4b62ea5229c8676dea02c0"

[vars]
APP_ENV = "production"
APP_NAME = "Shopee Product Research AI"

# Pass-through secrets to jobProcessor:
#   NINEROUTER_BASE_URL, NINEROUTER_API_KEY (9router AI gateway)
#   BROWSER_RUN_BASE_URL, BROWSER_RUN_API_KEY (Browser Run)
#   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Cloudflare Browser Rendering)

[[d1_databases]]; [[r2_buckets]]; [[queues.consumers]]  # same as API
```

## Secret Variables (set via `wrangler secret put`)

| Variable | Required | Used By | Notes |
|---|---:|---|---|
| `CLOUDFLARE_API_TOKEN` | When CloudflareBrowserRendering enabled | queueConsumer | API token with `Browser Rendering - Edit` permission |
| `CLOUDFLARE_ACCOUNT_ID` | When CloudflareBrowserRendering enabled | queueConsumer | Account ID (often duplicated in wrangler.toml) |
| `NINEROUTER_API_KEY` | When 9router fallback used | api + queueConsumer | 9router AI gateway key |
| `SESSION_SECRET` | Recommended | api | Session signing (currently session uses opaque token, not JWT) |
| `PASSWORD_PEPPER` | Recommended | api | Pepper appended to password before PBKDF2. Production value: `shopee-research-pepper-v1-2026` |
| `BROWSER_RUN_BASE_URL` | When BrowserRun adapter used | api + queueConsumer | Browser Run service base URL |
| `BROWSER_RUN_API_KEY` | When BrowserRun adapter used | api + queueConsumer | Browser Run service API key |

## Non-secret Environment Variables

In `[vars]` of wrangler.toml. Not secret but still loaded from config, not hardcoded in source.

| Variable | Default | Used By | Notes |
|---|---:|---|---|
| `APP_ENV` | `production` | api + queueConsumer | `development`, `staging`, `production` |
| `APP_NAME` | `Shopee Product Research AI` | api + queueConsumer | Display name |
| `APP_BASE_URL` | empty | api | Frontend URL for CORS |
| `JOB_POLL_INTERVAL_MS` | `3000` | api | Polling interval hint for frontend |
| `MAX_COMPARE_LINKS` | `5` | api + frontend | PRD §8.4 cap |
| `KEYWORD_SEARCH_LIMIT` | `10` | api + frontend | PRD §8.3 default |
| `DEFAULT_SHIPPED_FROM` | `DKI Jakarta` | api + frontend | PRD §8.3 default |

## Runtime Configuration (D1-First, PRD §Runtime Configuration)

Settings that admins can change at runtime live in D1 config tables. Read precedence:

1. **Active D1 row** (`isEnabled=1`, `isDefault=1` where applicable).
2. **Safe environment bootstrap default** (D1 empty).
3. **Built-in development fallback** (only for local dev, never for production values).

### D1 Config Tables

| Table | Purpose |
|---|---|
| `sh_appConfigs` | App-wide settings (max compare links, default shipped from, etc.) |
| `sh_aiProviderConfigs` | AI providers (9router, custom) |
| `sh_aiModelConfigs` | AI models with `usageType` (reasoning/extraction/fallback/vision/test) |
| `sh_searchProviderConfigs` | Search providers with priority |
| `sh_scoringConfigs` | Scoring weight configuration |
| `sh_configAuditLogs` | Audit trail of config changes |

### Config CRUD API (Admin Only)

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
POST   /api/admin/configs/ai-providers/:id/test  (test provider)

GET    /api/admin/configs/ai-models
... (same CRUD)
POST   /api/admin/configs/ai-models/:id/test  (test model)

GET    /api/admin/configs/search-providers
... (same CRUD)
POST   /api/admin/configs/search-providers/:id/test

GET    /api/admin/configs/scoring
... (same CRUD)
```

## Frontend Configuration UI (PRD §Required Configuration UI)

`apps/web/src/pages/ConfigPage.tsx` provides tabbed UI:
- Tab 1: App configs
- Tab 2: AI Providers
- Tab 3: AI Models (add new, change primary/fast/fallback, test)
- Tab 4: Search Providers (priority editor)
- Tab 5: Scoring (weight editor)

Plus per-row actions: Create, Read, Update, Disable, Test, View last test result.

## Token Rotation

If `CLOUDFLARE_API_TOKEN` was ever written to docs, files, or shell history, **treat as exposed** and rotate via Cloudflare dashboard → My Profile → API Tokens → Roll. Update via `wrangler secret put CLOUDFLARE_API_TOKEN` for each Worker that needs it.
