# Autopilot Backlog

This backlog is the execution queue for 100% autopilot mode.

## Phase 0 — Source of Truth and Autopilot Control

- [x] TASK-001 Import source of truth docs
- [x] TASK-002 Create AI autopilot policy files
- [x] TASK-003 Create validation scripts
- [x] TASK-004 Create quality gate script

## Phase 1 — Monorepo Foundation

- [x] TASK-010 Setup pnpm workspace
- [x] TASK-011 Setup React Vite frontend
- [x] TASK-012 Setup Cloudflare Workers API
- [x] TASK-013 Setup shared TypeScript types
- [x] TASK-014 Setup Zod validation schemas
- [x] TASK-015 Setup lint, typecheck, test, and build scripts

## Phase 2 — Cloudflare Foundation

- [x] TASK-020 Setup wrangler config with existing DB and LOGS bindings
- [x] TASK-021 Setup D1 schema using sh_ tables and camelCase columns
- [x] TASK-022 Setup R2 snapshot helper
- [x] TASK-023 Setup Cloudflare Queue producer
- [x] TASK-024 Setup Cloudflare Queue consumer
- [x] TASK-025 Setup environment validation

## Phase 3 — Auth

- [x] TASK-030 Build auth schema
- [x] TASK-031 Build register API
- [x] TASK-032 Build login API
- [x] TASK-033 Build logout API
- [x] TASK-034 Build me API
- [x] TASK-035 Build frontend login/register pages
- [x] TASK-036 Build protected routes

## Phase 4 — Runtime Configuration

- [x] TASK-040 Build configuration database tables
- [x] TASK-041 Build app config CRUD API
- [x] TASK-042 Build AI provider config CRUD API
- [x] TASK-043 Build AI model config CRUD API
- [x] TASK-044 Build search provider config CRUD API
- [x] TASK-045 Build scoring config CRUD API
- [x] TASK-046 Build frontend configuration CRUD page
- [x] TASK-047 Build 9router model test API
- [x] TASK-048 Build 9router model test frontend

## Phase 5 — Mock Shopee Flow

- [x] TASK-050 Create Shopee product fixture data
- [x] TASK-051 Create Shopee shop fixture data
- [x] TASK-052 Create ProductSnapshot contract
- [x] TASK-053 Create ShopSnapshot contract
- [x] TASK-054 Create MockShopeeExtractor
- [x] TASK-055 Build compare links API using mock extractor
- [x] TASK-056 Build research session creation
- [x] TASK-057 Build job creation and polling
- [x] TASK-058 Save products, shops, weights, and comparison items to D1
- [x] TASK-059 Build compare links frontend page

## Phase 6 — Scoring and Risk

- [x] TASK-060 Build deterministic scoring engine
- [x] TASK-061 Build score breakdown
- [x] TASK-062 Build risk detection engine
- [x] TASK-063 Build data quality checker
- [x] TASK-064 Build comparison ranking
- [x] TASK-065 Build result page
- [x] TASK-066 Build red flag UI
- [x] TASK-067 Build score breakdown UI

## Phase 7 — Mastra and 9router

- [x] TASK-070 Setup Mastra workflow skeleton
- [x] TASK-071 Build 9router client from config table
- [x] TASK-072 Build Recommendation Writer Agent
- [x] TASK-073 Build Risk Analyzer Agent
- [x] TASK-074 Build Data Quality Agent
- [x] TASK-075 Build AI report schema validator
- [x] TASK-076 Save AI report to D1
- [x] TASK-077 Save raw AI response to R2
- [x] TASK-078 Render AI report in frontend

## Phase 8 — Real Shopee URL Resolver

- [x] TASK-080 Build Shopee URL parser
- [x] TASK-081 Build short URL redirect resolver
- [x] TASK-082 Build canonical URL normalizer
- [x] TASK-083 Extract shopId and itemId
- [x] TASK-084 Add resolver fallback interface
- [x] TASK-085 Add resolver diagnostics UI

## Phase 9 — Real Shopee Extraction

- [x] TASK-090 Build 9router web fetch adapter
- [x] TASK-091 Build Browser Run adapter interface
- [x] TASK-092 Build fallback extractor strategy
- [x] TASK-093 Build product parser
- [x] TASK-094 Build shop parser
- [x] TASK-095 Build product weight extractor
- [x] TASK-096 Build feature extractor
- [x] TASK-097 Save raw product snapshot to R2
- [x] TASK-098 Add partial success handling

## Phase 10 — Keyword Search Top 10

- [x] TASK-100 Build keyword search API
- [x] TASK-101 Build search provider adapter
- [x] TASK-102 Build candidate collector
- [x] TASK-103 Build DKI Jakarta shippedFrom filter
- [x] TASK-104 Build candidate enrichment job
- [x] TASK-105 Build top 10 ranking
- [x] TASK-106 Build keyword search frontend page
- [x] TASK-107 Build keyword search result page

## Phase 11 — History and Dashboard

- [x] TASK-110 Build dashboard page
- [x] TASK-111 Build research history page
- [x] TASK-112 Build research detail page
- [x] TASK-113 Build job logs page
- [x] TASK-114 Build product detail page
- [x] TASK-115 Build shop detail page

## Phase 12 — Hardening

- [x] TASK-120 Add API rate limit
- [x] TASK-121 Add retry policy
- [x] TASK-122 Add error handling standardization
- [x] TASK-123 Add extraction failure logs
- [x] TASK-124 Add config audit logs
- [x] TASK-125 Add no-hardcode validation
- [x] TASK-126 Add database naming validation
- [x] TASK-127 Add deployment checklist
- [x] TASK-128 Add final README runbook

## Phase 13 — Production Bug Fixes (f301fc7)

- [x] TASK-129 Fix 9router SSE JSON parse in nineRouterFetchAdapter and browserRunAdapter
- [x] TASK-130 Implement 9router web_fetch tool agentic loop (max 3 turns)
- [x] TASK-131 Pass CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets from queue consumer to jobProcessor
- [x] TASK-132 Build CloudflareBrowserRenderingAdapter as primary production search adapter
- [x] TASK-133 Remove mock data fallback from production adapters (PRD §8.6 no-fabrication compliance)
- [x] TASK-134 Clean polluted test data from D1 (20 products, 60 features, 20 weights, etc.)
- [x] TASK-135 Fix ShopDetailPage statusJson.join crash (API returns string, frontend expected array)
- [x] TASK-136 Fix API statusJson inconsistency on shop endpoints (server-side parse to array)
- [x] TASK-137 Fix ResultPage TanStack Query cache and add 404 handling with user-friendly message
- [x] TASK-138 Add Pages Function _worker.js for /api/* proxy with cache-busting and asset fallback
- [x] TASK-139 Set production PASSWORD_PEPPER secret for deterministic password hash verification
- [x] TASK-140 Add deployment build infrastructure (copy-pages-function.mjs, deploy:pages script)
- [x] TASK-141 Add PRD coverage TDD tests (40 new tests in apps/web/src/__tests__/prd-*.test.ts)
- [x] TASK-142 Comprehensive documentation refresh to match current state (f301fc7 + TASK-129..141)

## Phase 14 — Production Tooling (Temp Workspace, out-of-tree)

- [x] TASK-143 Build isolated Playwright E2E harness in /tmp/opencode/playwright-harness
- [x] TASK-144 Validate production login + keyword search end-to-end via Playwright

## Phase 15 — Outstanding (Blocked by External Dependency)

- [ ] TASK-145 Real Shopee data acquisition via Shopee Open Platform partnership
      (PRD §7 #7 — official API preferred. Out of MVP code scope. Requires
      business registration at https://openplatform.shopee.com and partner
      approval. Once partner ID/key is provided, integrate the official
      Shopee API as primary search/extract adapter in packages/shopee/.)
- [ ] TASK-146 Optional VPS scraper fallback for Shopee
      (PRD §7 #7 — last resort. Requires non-Cloudflare server in
      Southeast Asia region with residential IP. Add as providerType="vpsScraper"
      in sh_searchProviderConfigs when available.)
- [ ] TASK-147 Token rotation: rotate CLOUDFLARE_API_TOKEN, NINEROUTER_API_KEY, GitHub PAT
      (Treat all as exposed via prior conversation history and key.md.
      Rotate via Cloudflare dashboard / 9router dashboard / GitHub settings,
      then re-`wrangler secret put` for each affected Worker.)

## Phase 16 — Backlog (Future, not yet started)

- [ ] TASK-150 Implement price tracking (PRD §9 — Excluded from MVP)
- [ ] TASK-151 Implement price drop alerts (PRD §9 — Excluded)
- [ ] TASK-152 Build browser extension (PRD §9 — Excluded)
- [ ] TASK-153 Mobile native app (PRD §9 — Excluded)
- [ ] TASK-154 Payment / subscription integration (PRD §9 — Excluded)
- [ ] TASK-155 Multi-marketplace support beyond Shopee (PRD §9 — Excluded)
- [ ] TASK-156 Auto-buy (PRD §9 — Excluded)
- [ ] TASK-157 Checkout integration (PRD §9 — Excluded)
- [ ] TASK-158 Session management UI (PRD §8.1: revocation, active devices, etc.)
- [ ] TASK-159 User profile management (change name, change password, delete account)
- [ ] TASK-160 Export research result as PDF/CSV
- [ ] TASK-161 Webhook / notification when async job completes
- [ ] TASK-162 Admin user management (list users, suspend, force logout all sessions)
