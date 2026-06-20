# Deployment Checklist

## Prerequisites

- [ ] Cloudflare account with D1, R2, Queues, and Workers enabled
- [ ] `wrangler` CLI installed and authenticated (`wrangler login`)
- [ ] D1 database `multi_Ai_db` exists
- [ ] R2 bucket `multi-apps-ai-bucket` exists
- [ ] Cloudflare Queue `shopee-research-queue` exists
- [ ] Dead letter queue `shopee-research-dlq` exists

## Step 1: Apply Database Migrations

```bash
# Apply all migrations in order
wrangler d1 execute multi_Ai_db --file=packages/db/migrations/0001_initial_schema.sql
wrangler d1 execute multi_Ai_db --file=packages/db/migrations/0002_extraction_failures.sql
wrangler d1 execute multi_Ai_db --file=packages/db/migrations/0003_config_audit_logs.sql
```

## Step 2: Set Secrets

```bash
# Required secrets
wrangler secret put NINEROUTER_API_KEY --name shopee-product-research-api
wrangler secret put SESSION_SECRET --name shopee-product-research-api

# Optional secrets
wrangler secret put PASSWORD_PEPPER --name shopee-product-research-api
```

## Step 3: Build Frontend

```bash
# Build the React frontend
pnpm --filter @shopee-research/web build
```

The frontend output is in `apps/web/dist/`. Deploy to Cloudflare Pages or serve from the API worker.

## Step 4: Deploy API Worker

```bash
# Deploy the API worker
cd workers/api
wrangler deploy
```

## Step 5: Deploy Queue Consumer

```bash
# Deploy the queue consumer worker
cd workers/queueConsumer
wrangler deploy
```

## Step 6: Verify Deployment

- [ ] API health check: `GET /api/health` returns `{ status: "ok" }`
- [ ] Public config endpoint: `GET /api/config/apps/public` returns configs
- [ ] Frontend loads in browser
- [ ] User registration works
- [ ] User login works
- [ ] Compare links research creates a job
- [ ] Keyword search research creates a job
- [ ] Queue consumer processes jobs

## Step 7: Seed Initial Configuration

After deployment, seed the initial configuration via the API or admin UI:

- [ ] App configs (e.g., `app.name`, `app.defaultShippedFrom`)
- [ ] AI provider configs (9router base URL, auth type)
- [ ] AI model configs (primary, fast, fallback models)
- [ ] Search provider configs
- [ ] Scoring configs (default weights)

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `APP_ENV` | Environment | `production` |
| `APP_NAME` | App display name | `Shopee Product Research AI` |
| `APP_BASE_URL` | Frontend base URL | `https://your-domain.com` |
| `NINEROUTER_BASE_URL` | 9router gateway URL | Set via runtime config |
| `JOB_POLL_INTERVAL_MS` | Job poll interval | `3000` |
| `MAX_COMPARE_LINKS` | Max compare links | `5` |
| `KEYWORD_SEARCH_LIMIT` | Default search limit | `10` |
| `DEFAULT_SHIPPED_FROM` | Default shipped filter | `DKI Jakarta` |

## Rollback

If deployment fails:

1. Revert worker: `wrangler rollback --name shopee-product-research-api`
2. Revert queue consumer: `wrangler rollback --name shopee-research-queue-consumer`
3. Check D1 migration status and revert if needed
