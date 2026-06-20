# Shopee Product Research AI — Source of Truth Docs

Dokumen ini adalah source of truth untuk membangun aplikasi Shopee Product Research AI menggunakan AI coding agent.

Aplikasi ini adalah web app multi-user berbasis Cloudflare yang membantu user:

1. Mencari 10 produk terbaik Shopee berdasarkan keyword dengan filter utama `DKI Jakarta`.
2. Membandingkan maksimal 5 link produk Shopee.
3. Resolve short URL Shopee seperti `id.shp.ee/...`.
4. Mengambil data produk, data toko, fitur, berat produk, rating, total review, dan total item terjual.
5. Menghasilkan ranking objektif dan report naratif AI menggunakan Mastra + 9router.

## Dokumen utama

| File | Fungsi |
|---|---|
| `docs/prd.md` | Product Requirements Document, Scope, Stories, Criteria |
| `docs/architecture.md` | Arsitektur, Technical Decisions, Stack, Overview |
| `docs/shared/enums.md` | Enum canonical untuk API, DB, UI, dan tests |
| `docs/database/schema.md` | Database schema D1 |
| `docs/database/naming-rules.md` | Aturan nama table dan column |
| `docs/api/api-contract.md` | Kontrak API |
| `docs/ai-orchestration.md` | Workflow Mastra, Prompts, 9router config |
| `docs/tasks/autopilot-task-contract.md` | Aturan ekspansi task autopilot |
| `.ai/agent-instructions.md` | Aturan wajib untuk AI coding agent |

## Aturan paling penting

1. Table database wajib prefix `sh_`.
2. Nama column database tidak boleh mengandung underscore.
3. Frontend memakai React + Vite.
4. Package manager memakai pnpm.
5. Validation memakai Zod.
6. Backend utama memakai Cloudflare Workers.
7. Database utama memakai Cloudflare D1.
8. Queue memakai Cloudflare Queues.
9. Storage besar memakai Cloudflare R2.
10. Mastra dipakai sebagai orchestrator.
11. 9router dipakai sebagai AI gateway.
12. Shopee extraction harus adapter-based dan tidak boleh bypass CAPTCHA/login.

## Cara menggunakan docs ini dengan AI agent

Setiap task harus menyuruh agent membaca:

1. `docs/prd.md`
2. `docs/architecture.md`
3. `docs/api/api-contract.md`
4. `docs/database/schema.md`
5. `.ai/agent-instructions.md`
6. File task yang sedang dikerjakan

Agent tidak boleh mengubah keputusan teknis tanpa ADR dan approval manusia.

## v3 Additions

This version adds configuration-first documentation:

- `docs/configuration/env-variables.md`
- `docs/configuration/runtime-configuration.md`
- `docs/shopee/search-api-strategy.md`
- `docs/ui/configuration-crud.md`

Important rules:

- Use existing D1 database `multi_Ai_db` with binding `DB`.
- Use existing R2 bucket `multi-apps-ai-bucket` with binding `LOGS`.
- Do not create a new D1 database for MVP.
- Do not hardcode provider, model, scoring, search, or runtime settings.
- Runtime configuration must be stored in D1 and editable from frontend admin/settings.
- Secrets must not be stored in D1 or committed to repo.
## 100% Autopilot Mode

This repository includes an autopilot execution system for AI coding CLI tools such as OpenCode or pencode-style agents.

Primary files:

- `.ai/autopilot-system.md`
- `.ai/agent-instructions.md`
- `docs/tasks/backlog.md`
- `docs/tasks/current-task.md`
- `docs/tasks/done.md`
- `docs/tasks/failed.md`
- `scripts/quality-gate.sh`
- `scripts/quality-gate.js`
- `scripts/validate-db-naming.js`
- `scripts/validate-no-hardcode.js`
- `scripts/validate-source-of-truth.js`

Autopilot command to give the coding CLI:

```txt
Read .ai/autopilot-prompt.md and run the full autonomous build loop until every task in docs/tasks/backlog.md is completed. Do not ask for confirmation unless a stop condition is triggered.
```

Autopilot must obey:

- No new D1 database.
- Existing D1 binding: `DB`.
- Existing D1 database: `multi_Ai_db`.
- Existing R2 binding: `LOGS`.
- Existing R2 bucket: `multi-apps-ai-bucket`.
- All runtime configuration must be stored in configuration tables and managed from frontend CRUD.
- No hardcoded provider, model, base URL, scoring, or search strategy.
- Table names must use `sh_` prefix.
- Column names must not contain underscores.
- Job status enum must use `partialSuccess`, not alternate spellings.
- Shop status enum must use `STARPLUS`, not `STAR_PLUS`.

## Development Runbook

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Cloudflare account (for deployment)

### Setup

```bash
# Install dependencies
pnpm install

# Run quality gate (lint, typecheck, test, build, validation scripts)
node scripts/quality-gate.js
```

### Commands

| Command | Description |
|---|---|
| `pnpm lint` | ESLint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm build` | Build all packages |
| `node scripts/quality-gate.js` | Full quality gate |
| `node scripts/validate-db-naming.js` | Validate DB naming rules |
| `node scripts/validate-no-hardcode.js` | Validate no hardcoded secrets/config |
| `node scripts/validate-source-of-truth.js` | Validate source of truth docs |

### Project Structure

```
apps/web/               # React + Vite frontend
workers/api/            # Cloudflare Workers API (Hono)
workers/queueConsumer/  # Cloudflare Queue consumer
packages/ai/            # Mastra + 9router integration
packages/auth/          # Password hashing, session management
packages/core/          # Scoring engine, risk detection, quality checker
packages/db/            # D1 repositories, R2 helpers, migrations
packages/shared/        # Zod schemas, enums, constants
packages/shopee/        # Shopee extraction, parsing, search
```

### Key Technologies

- **Frontend:** React + Vite + TanStack Router + TanStack Query
- **Backend:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2
- **Queue:** Cloudflare Queues
- **Validation:** Zod
- **AI:** Mastra orchestrator + 9router gateway
- **Package Manager:** pnpm

### Database

- Tables use `sh_` prefix
- Columns use camelCase (no underscores)
- Migrations in `packages/db/migrations/`
- Schema docs in `docs/database/schema.md`

### Configuration

All runtime configuration is stored in D1 and editable via the admin UI at `/settings/config`. No provider, model, base URL, scoring, or search strategy is hardcoded.

Secrets are set via Cloudflare secrets (`wrangler secret put`), never in code or D1.

### Deployment

See `docs/deployment/checklist.md` for the full deployment checklist.
