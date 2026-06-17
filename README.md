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
| `docs/prd/prd.md` | Product Requirements Document utama |
| `docs/prd/user-stories.md` | User stories lengkap |
| `docs/prd/acceptance-criteria.md` | Acceptance criteria lengkap |
| `docs/architecture/technical-decisions.md` | Keputusan teknis yang dikunci |
| `docs/architecture/implementation-stack.md` | Stack implementasi yang dikunci |
| `docs/architecture/system-overview.md` | Arsitektur sistem |
| `docs/shared/enums.md` | Enum canonical untuk API, DB, UI, dan tests |
| `docs/database/schema.md` | Database schema D1 |
| `docs/database/naming-rules.md` | Aturan nama table dan column |
| `docs/api/api-contract.md` | Kontrak API |
| `docs/ai/mastra-orchestrator.md` | Workflow dan agent Mastra |
| `docs/tasks/autopilot-task-contract.md` | Aturan ekspansi task autopilot |
| `.ai/agent-rules.md` | Aturan wajib untuk AI coding agent |

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

1. `docs/prd/prd.md`
2. `docs/architecture/technical-decisions.md`
3. `docs/architecture/system-overview.md`
4. `docs/architecture/implementation-stack.md`
5. `docs/shared/enums.md`
6. `docs/api/api-contract.md`
7. `docs/database/schema.md`
8. `docs/tasks/autopilot-task-contract.md`
9. `.ai/agent-rules.md`
10. `.ai/done-definition.md`
11. File task yang sedang dikerjakan

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

- `.ai/autopilot-prompt.md`
- `.ai/autopilot-policy.md`
- `.ai/stop-conditions.md`
- `.ai/task-runner.md`
- `.ai/self-review.md`
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
