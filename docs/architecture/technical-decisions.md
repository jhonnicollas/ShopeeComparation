# Technical Decisions — Shopee Product Research AI

Dokumen ini adalah keputusan teknis yang dikunci untuk MVP. AI agent tidak boleh mengubah keputusan ini tanpa membuat ADR baru dan mendapat approval.

| # | Keputusan | Pilihan Final | Impact |
|---:|---|---|---|
| 1 | Framework frontend | **React + Vite + TanStack Router + TanStack Query** | Menentukan seluruh `apps/web`. Aplikasi dibuat sebagai SPA yang memanggil Cloudflare Workers API. Tidak memakai SSR agar deployment Cloudflare lebih sederhana. |
| 2 | Package manager | **pnpm + pnpm workspace** | Menentukan monorepo setup, script lint/typecheck/test/build, dan dependency management lintas apps/packages. |
| 3 | ID generation strategy | **nanoid + entity prefix** | Semua entity memakai ID string prefixed, misalnya `usr_`, `ses_`, `rsr_`, `prd_`, `shp_`, `cmp_`, `job_`. ID dibuat di application layer, bukan auto increment. |
| 4 | Auth implementation | **Email/password + WebCrypto PBKDF2-SHA-256 + opaque session cookie** | Menentukan `TASK-017`. Password di-hash dengan salt unik dan iterasi configurable. Session memakai token acak, token disimpan sebagai hash di D1, cookie `shSession` HttpOnly/Secure/SameSite=Lax. |
| 5 | 9router configuration | **Environment-based 9router client** | Menentukan `TASK-034`. Config memakai `NINEROUTER_BASE_URL`, `NINEROUTER_API_KEY`, `NINEROUTER_MODEL_PRIMARY`, `NINEROUTER_MODEL_FAST`, `NINEROUTER_MODEL_FALLBACK`, dan timeout/retry policy. |
| 6 | Job progress transport | **Polling, bukan WebSocket** | Menentukan frontend architecture. Frontend poll `GET /api/jobs/:id` dengan interval adaptif. WebSocket ditunda agar Cloudflare Worker, D1, dan Queue lebih sederhana. |
| 7 | Shopee search strategy | **Adapter-based extraction: official API jika tersedia, fallback scrape terbatas** | Menentukan `TASK-060–065`. Strategi urutan: official/affiliate API jika ada → fetch ringan → 9router web fetch → Browser Run → optional VPS scraper. Tidak login, tidak bypass CAPTCHA, tidak akses cart/checkout/order/user. |
| 8 | Validation library | **Zod** | Menentukan `packages/shared`. Semua request API, response extractor, output AI, dan contract internal divalidasi dengan Zod. |
| 9 | Backend utama | **Cloudflare Workers** | API utama, queue consumer, Mastra workflow ringan, dan endpoint job status berada di Cloudflare. |
| 10 | Database utama | **Cloudflare D1** | D1 menyimpan data structured. Raw HTML, raw JSON, screenshot, dan response AI besar masuk R2. |
| 11 | Queue | **Cloudflare Queues** | Semua job berat diproses async. Request utama hanya membuat research session dan job. |
| 12 | Object storage | **Cloudflare R2** | Menyimpan snapshot besar, raw response, dan debug artifact agar D1 tetap ringan. |
| 13 | AI orchestration | **Mastra** | Mastra mengatur workflow dan agent; scoring tetap deterministic di `packages/core`. |
| 14 | Database naming | **Table prefix `sh_`, column camelCase tanpa underscore** | Semua table wajib diawali `sh_`. Semua column **tidak boleh mengandung `_`**. Column menggunakan camelCase. |

## Locked Decisions

Keputusan di atas berlaku untuk semua task implementasi. Jika agent ingin mengubah salah satu keputusan, agent harus:

1. Membuat file ADR baru di `docs/adr`.
2. Menjelaskan alasan perubahan.
3. Menjelaskan dampak ke folder, API, database, dan testing.
4. Menunggu approval manusia sebelum coding.

## Additional Locked Decisions — Configuration and Providers

| # | Decision | Value | Impact |
|---:|---|---|---|
| 9 | Runtime configuration storage | D1 tables with frontend CRUD | Semua setting runtime harus dikelola via UI admin/settings dan tidak boleh di-hardcode. |
| 10 | Config table naming | Tables use `sh_` prefix, columns use camelCase | Menjaga konsistensi D1 schema. |
| 11 | Secret storage | Cloudflare secrets / CI secrets only | D1 hanya menyimpan `secretRef`, tidak menyimpan nilai token/API key. |
| 12 | Cloudflare D1 resource | Existing `multi_Ai_db` via binding `DB` | Tidak membuat database baru. |
| 13 | Cloudflare R2 resource | Existing `multi-apps-ai-bucket` via binding `LOGS` | Semua raw snapshot/log besar masuk bucket ini. |
| 14 | AI provider CRUD | Provider and model config editable from frontend | Admin bisa test provider/model dari UI. |
| 15 | Search provider CRUD | Search strategy editable from frontend | Strategy API/scrape/fallback bisa diganti tanpa redeploy. |

## Cloudflare Resource Decision

Use existing Cloudflare resources only for MVP:

```toml
account_id = "79dea2845a4b62ea5229c8676dea02c0"

[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"

[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"
```

API tokens must not be committed.
