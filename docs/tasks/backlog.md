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
- [ ] TASK-013 Setup shared TypeScript types
- [ ] TASK-014 Setup Zod validation schemas
- [ ] TASK-015 Setup lint, typecheck, test, and build scripts

## Phase 2 — Cloudflare Foundation

- [ ] TASK-020 Setup wrangler config with existing DB and LOGS bindings
- [ ] TASK-021 Setup D1 schema using sh_ tables and camelCase columns
- [ ] TASK-022 Setup R2 snapshot helper
- [ ] TASK-023 Setup Cloudflare Queue producer
- [ ] TASK-024 Setup Cloudflare Queue consumer
- [ ] TASK-025 Setup environment validation

## Phase 3 — Auth

- [ ] TASK-030 Build auth schema
- [ ] TASK-031 Build register API
- [ ] TASK-032 Build login API
- [ ] TASK-033 Build logout API
- [ ] TASK-034 Build me API
- [ ] TASK-035 Build frontend login/register pages
- [ ] TASK-036 Build protected routes

## Phase 4 — Runtime Configuration

- [ ] TASK-040 Build configuration database tables
- [ ] TASK-041 Build app config CRUD API
- [ ] TASK-042 Build AI provider config CRUD API
- [ ] TASK-043 Build AI model config CRUD API
- [ ] TASK-044 Build search provider config CRUD API
- [ ] TASK-045 Build scoring config CRUD API
- [ ] TASK-046 Build frontend configuration CRUD page
- [ ] TASK-047 Build 9router model test API
- [ ] TASK-048 Build 9router model test frontend

## Phase 5 — Mock Shopee Flow

- [ ] TASK-050 Create Shopee product fixture data
- [ ] TASK-051 Create Shopee shop fixture data
- [ ] TASK-052 Create ProductSnapshot contract
- [ ] TASK-053 Create ShopSnapshot contract
- [ ] TASK-054 Create MockShopeeExtractor
- [ ] TASK-055 Build compare links API using mock extractor
- [ ] TASK-056 Build research session creation
- [ ] TASK-057 Build job creation and polling
- [ ] TASK-058 Save products, shops, weights, and comparison items to D1
- [ ] TASK-059 Build compare links frontend page

## Phase 6 — Scoring and Risk

- [ ] TASK-060 Build deterministic scoring engine
- [ ] TASK-061 Build score breakdown
- [ ] TASK-062 Build risk detection engine
- [ ] TASK-063 Build data quality checker
- [ ] TASK-064 Build comparison ranking
- [ ] TASK-065 Build result page
- [ ] TASK-066 Build red flag UI
- [ ] TASK-067 Build score breakdown UI

## Phase 7 — Mastra and 9router

- [ ] TASK-070 Setup Mastra workflow skeleton
- [ ] TASK-071 Build 9router client from config table
- [ ] TASK-072 Build Recommendation Writer Agent
- [ ] TASK-073 Build Risk Analyzer Agent
- [ ] TASK-074 Build Data Quality Agent
- [ ] TASK-075 Build AI report schema validator
- [ ] TASK-076 Save AI report to D1
- [ ] TASK-077 Save raw AI response to R2
- [ ] TASK-078 Render AI report in frontend

## Phase 8 — Real Shopee URL Resolver

- [ ] TASK-080 Build Shopee URL parser
- [ ] TASK-081 Build short URL redirect resolver
- [ ] TASK-082 Build canonical URL normalizer
- [ ] TASK-083 Extract shopId and itemId
- [ ] TASK-084 Add resolver fallback interface
- [ ] TASK-085 Add resolver diagnostics UI

## Phase 9 — Real Shopee Extraction

- [ ] TASK-090 Build 9router web fetch adapter
- [ ] TASK-091 Build Browser Run adapter interface
- [ ] TASK-092 Build fallback extractor strategy
- [ ] TASK-093 Build product parser
- [ ] TASK-094 Build shop parser
- [ ] TASK-095 Build product weight extractor
- [ ] TASK-096 Build feature extractor
- [ ] TASK-097 Save raw product snapshot to R2
- [ ] TASK-098 Add partial success handling

## Phase 10 — Keyword Search Top 10

- [ ] TASK-100 Build keyword search API
- [ ] TASK-101 Build search provider adapter
- [ ] TASK-102 Build candidate collector
- [ ] TASK-103 Build DKI Jakarta shippedFrom filter
- [ ] TASK-104 Build candidate enrichment job
- [ ] TASK-105 Build top 10 ranking
- [ ] TASK-106 Build keyword search frontend page
- [ ] TASK-107 Build keyword search result page

## Phase 11 — History and Dashboard

- [ ] TASK-110 Build dashboard page
- [ ] TASK-111 Build research history page
- [ ] TASK-112 Build research detail page
- [ ] TASK-113 Build job logs page
- [ ] TASK-114 Build product detail page
- [ ] TASK-115 Build shop detail page

## Phase 12 — Hardening

- [ ] TASK-120 Add API rate limit
- [ ] TASK-121 Add retry policy
- [ ] TASK-122 Add error handling standardization
- [ ] TASK-123 Add extraction failure logs
- [ ] TASK-124 Add config audit logs
- [ ] TASK-125 Add no-hardcode validation
- [ ] TASK-126 Add database naming validation
- [ ] TASK-127 Add deployment checklist
- [ ] TASK-128 Add final README runbook
