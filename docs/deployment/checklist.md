# Deployment Checklist

## Live Production State

The app is already deployed at:

- **Frontend (Pages):** https://shopee-product-research-web.pages.dev
- **API Worker:** https://shopee-product-research-api.indiehomesungairaya.workers.dev
- **Queue Consumer:** https://shopee-product-research-queue-consumer.indiehomesungairaya.workers.dev

Latest commit: see `git log --oneline -1`.

## Prerequisites

- [x] Cloudflare account `79dea2845a4b62ea5229c8676dea02c0` with D1, R2, Queues, Workers, Browser Run
- [x] `wrangler` CLI installed (v4.x)
- [x] `CLOUDFLARE_API_TOKEN` set as env var (set via `wrangler secret put` for each Worker)
- [x] D1 database `multi_Ai_db` (id `b80ca989-6771-427f-a656-c7ab6ffc17ce`) — 22 tables, all migrations applied
- [x] R2 bucket `multi-apps-ai-bucket`
- [x] Cloudflare Queue `shopee-research-queue` + DLQ `shopee-research-dlq`

## Step 1: Verify D1 Schema

```bash
# Confirm all 22 tables exist
wrangler d1 execute multi_Ai_db --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sh_%' ORDER BY name"
# Expected: 22 rows (sh_users, sh_sessions, ..., sh_scoringConfigs)
```

Naming rules are validated by `scripts/validate-db-naming.js` (run in `node scripts/quality-gate.js`).

## Step 2: Set Required Secrets

```bash
# Cloudflare Browser Rendering (required for primary Shopee adapter)
echo "<your-token>" | wrangler secret put CLOUDFLARE_API_TOKEN --config workers/queueConsumer/wrangler.toml
echo "79dea2845a4b62ea5229c8676dea02c0" | wrangler secret put CLOUDFLARE_ACCOUNT_ID --config workers/queueConsumer/wrangler.toml

# 9router (fallback)
echo "<your-key>" | wrangler secret put NINEROUTER_API_KEY --config workers/api/wrangler.toml
echo "<your-key>" | wrangler secret put NINEROUTER_API_KEY --config workers/queueConsumer/wrangler.toml

# Browser Run (fallback)
echo "<url>" | wrangler secret put BROWSER_RUN_BASE_URL --config workers/api/wrangler.toml
echo "<url>" | wrangler secret put BROWSER_RUN_BASE_URL --config workers/queueConsumer/wrangler.toml
echo "<key>" | wrangler secret put BROWSER_RUN_API_KEY --config workers/api/wrangler.toml
echo "<key>" | wrangler secret put BROWSER_RUN_API_KEY --config workers/queueConsumer/wrangler.toml

# Auth (API only)
echo "shopee-research-pepper-v1-2026" | wrangler secret put PASSWORD_PEPPER --config workers/api/wrangler.toml
```

**Critical:** `workers/queueConsumer/src/index.ts` explicitly passes `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to `processJobSync`. If you don't set them, the queue consumer always falls back to 9router.

## Step 3: Build Frontend

```bash
# This runs vite build + copies _worker.js to dist/
pnpm --filter @shopee-research/web build
```

Output: `apps/web/dist/` with `index.html`, `assets/`, and `_worker.js` (Pages Function).

## Step 4: Deploy API Worker

```bash
pnpm exec wrangler deploy --config workers/api/wrangler.toml
```

## Step 5: Deploy Queue Consumer

```bash
pnpm exec wrangler deploy --config workers/queueConsumer/wrangler.toml
```

## Step 6: Deploy Frontend to Pages

```bash
pnpm exec wrangler pages deploy apps/web/dist \
  --project-name shopee-product-research-web \
  --branch main \
  --commit-dirty=true \
  --skip-caching
```

The `--skip-caching` ensures wrangler re-uploads (by default it dedups).

## Step 7: Verify Deployment

```bash
# API health
curl -sS https://shopee-product-research-api.indiehomesungairaya.workers.dev/api/health

# Pages Functions proxy
curl -sS https://shopee-product-research-web.pages.dev/api/health

# Public config
curl -sS https://shopee-product-research-web.pages.dev/api/config/apps/public

# Frontend root
curl -sS -o /dev/null -w "%{http_code}\n" https://shopee-product-research-web.pages.dev/
```

Expected: all 200.

## Step 8: End-to-End Smoke Test

1. Login at `https://shopee-product-research-web.pages.dev/login`
2. Submit a Compare Links request with 1–5 real Shopee URLs
3. Wait for job to reach `completed` / `partialSuccess` / `failed`
4. Check result page renders correctly (no `i.statusJson.join is not a function` error)
5. Submit a Keyword Search request
6. Verify failure is honest (`noData` if anti-bot blocks, not fabricated data)

## Step 9: Seed Initial Configuration

If D1 is fresh, seed via the API or admin UI (`/settings/config`):

- [ ] App config: `app.maxCompareLinks=5`, `app.keywordSearchLimit=10`, `app.defaultShippedFrom="DKI Jakarta"`
- [ ] AI provider: 9router (or Cloudflare direct)
- [ ] AI model `usageType=extraction` with `isDefault=1`
- [ ] Search provider (CloudflareBrowserRendering or 9router webFetch)
- [ ] Scoring config (default weights from PRD §8.9)

## Environment Variables Reference

See `docs/configuration/env-variables.md` for the full list.

| Variable | Description | Source |
|---|---|---|
| `APP_ENV` | `production` / `development` / `staging` | wrangler `[vars]` |
| `APP_NAME` | Display name | wrangler `[vars]` |
| `APP_BASE_URL` | Frontend base URL (for CORS) | wrangler `[vars]` |
| `JOB_POLL_INTERVAL_MS` | Frontend polling interval | wrangler `[vars]` |
| `MAX_COMPARE_LINKS` | 5 | wrangler `[vars]` |
| `KEYWORD_SEARCH_LIMIT` | 10 | wrangler `[vars]` |
| `DEFAULT_SHIPPED_FROM` | `DKI Jakarta` | wrangler `[vars]` |
| `CLOUDFLARE_API_TOKEN` | Browser Rendering API token | `wrangler secret put` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | `wrangler secret put` |
| `NINEROUTER_API_KEY` | 9router key | `wrangler secret put` |
| `BROWSER_RUN_BASE_URL` | Browser Run service URL | `wrangler secret put` |
| `BROWSER_RUN_API_KEY` | Browser Run service key | `wrangler secret put` |
| `PASSWORD_PEPPER` | Password hashing pepper | `wrangler secret put` |

## Rollback

If a deployment breaks production:

```bash
# Rollback a worker to its previous version
wrangler rollback --name shopee-product-research-api
wrangler rollback --name shopee-product-research-queue-consumer

# Rollback Pages to a previous deployment
wrangler pages deployment rollback \
  --project-name shopee-product-research-web \
  --deployment-id=<previous-deployment-id>
```

## Known Production Constraints

- **Cloudflare Browser Rendering vs Shopee anti-bot:** Shopee.co.id identifies Cloudflare Workers as a bot and serves an empty SPA shell. Real Shopee search returns 0 candidates. The app fails honestly with `noData` rather than fabricating data. To get real Shopee data: integrate the [Shopee Open Platform](https://openplatform.shopee.com) partnership.

- **Anti-bot + cloudflare IP detection:** Browser Run docs note "User-Agent parameter does not bypass bot protection. Requests from Browser Run will always be identified as a bot." Confirmed in production.

- **Token rotation:** The `CLOUDFLARE_API_TOKEN` was previously written to plain text in conversation history and `key.md`. Treat as exposed. Rotate via Cloudflare dashboard if you haven't already.
