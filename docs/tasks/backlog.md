# Backlog

## Phase 0 — Documentation Lock

- TASK-001 Create source of truth docs.
- TASK-002 Lock technical decisions.
- TASK-003 Lock database naming rules.
- TASK-004 Lock API contract.
- TASK-005 Lock AI agent rules.

## Phase 1 — Foundation

- TASK-010 Setup pnpm monorepo.
- TASK-011 Setup React + Vite app.
- TASK-012 Setup Workers API.
- TASK-013 Setup shared Zod schemas.
- TASK-014 Setup D1 schema and migrations.
- TASK-015 Setup R2 helper.
- TASK-016 Setup Cloudflare Queues helper.
- TASK-017 Setup auth.

## Phase 2 — Mock End-to-End

- TASK-020 Create Shopee fixtures.
- TASK-021 Create MockShopeeExtractor.
- TASK-022 Build compare links API with mock extractor.
- TASK-023 Build scoring engine.
- TASK-024 Build result UI.
- TASK-025 Build job polling.

## Phase 3 — Mastra + 9router

- TASK-030 Setup Mastra workflow skeleton.
- TASK-031 Setup 9router client.
- TASK-032 Build AI report workflow.
- TASK-033 Build data quality agent.
- TASK-034 Build risk analyzer agent.

## Phase 4 — Real Extraction

- TASK-040 Build Shopee URL resolver.
- TASK-041 Build product extractor.
- TASK-042 Build shop extractor.
- TASK-043 Build weight extractor.
- TASK-044 Add R2 snapshot storage.

## Phase 5 — Keyword Search

- TASK-060 Build keyword search API.
- TASK-061 Build search collector.
- TASK-062 Add DKI Jakarta filter.
- TASK-063 Enrich candidates.
- TASK-064 Rank top 10.
- TASK-065 Build keyword result page.

## Configuration and Provider Tasks

### TASK-018A: Add Runtime Configuration Tables

Create D1 migrations for:

- `sh_appConfigs`
- `sh_aiProviderConfigs`
- `sh_aiModelConfigs`
- `sh_searchProviderConfigs`
- `sh_scoringConfigs`

Acceptance:

- Table names use `sh_` prefix.
- Column names use camelCase and no underscore.
- Secret values are not stored.

### TASK-018B: Build Configuration CRUD API

Create admin-only CRUD API for app configs, AI providers, AI models, search providers, and scoring configs.

### TASK-018C: Build Configuration CRUD Frontend

Create frontend settings pages for runtime configuration.

### TASK-034A: Build 9router Provider Test UI

Admin can test selected 9router provider/model from frontend.

### TASK-060A: Build Search Provider Strategy Config

Search provider priority must be loaded from D1, not hardcoded.
