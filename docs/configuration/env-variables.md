# Environment Variables and Cloudflare Bindings

## Purpose

Dokumen ini adalah source of truth untuk environment variable, Cloudflare binding, D1 database, R2 bucket, dan aturan penyimpanan secret.

## Security Rule

Token, API key, password, dan secret value tidak boleh di-hardcode di source code, Markdown, migration, frontend bundle, atau D1.

Cloudflare API token yang diberikan saat planning tidak disimpan mentah di dokumen ini karena token tersebut adalah credential sensitif. Token harus segera di-rotate dan nilai barunya disimpan sebagai secret di environment deployment atau CI/CD secret store.

## Cloudflare Account

| Key | Value | Notes |
|---|---|---|
| cloudflareAccountId | `79dea2845a4b62ea5229c8676dea02c0` | Account ID untuk deployment Cloudflare |
| cloudflareApiToken | `<set-via-secret>` | Jangan commit token. Gunakan Cloudflare secret / CI secret |

## Required Cloudflare D1 Binding

Tidak boleh membuat database baru untuk MVP. Gunakan database berikut:

```toml
[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"
```

## Required Cloudflare R2 Binding

Gunakan bucket berikut:

```toml
[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"
```

## Wrangler Example

```toml
name = "shopee-product-research-ai"
main = "src/index.ts"
compatibility_date = "2026-06-17"
account_id = "79dea2845a4b62ea5229c8676dea02c0"

[[d1_databases]]
binding = "DB"
database_name = "multi_Ai_db"
database_id = "b80ca989-6771-427f-a656-c7ab6ffc17ce"

[[r2_buckets]]
binding = "LOGS"
bucket_name = "multi-apps-ai-bucket"
```

## Secret Variables

Secret variables wajib disimpan menggunakan Cloudflare secret, CI/CD secret, atau platform secret store.

| Variable | Required | Stored In | Notes |
|---|---:|---|---|
| `CLOUDFLARE_API_TOKEN` | Yes | CI/CD secret or local shell only | Token deployment. Jangan commit |
| `NINEROUTER_API_KEY` | Yes | Cloudflare secret | API key 9router |
| `SESSION_SECRET` | Yes | Cloudflare secret | Secret untuk session signing/encryption jika dipakai |
| `PASSWORD_PEPPER` | Recommended | Cloudflare secret | Extra pepper untuk password hashing jika dipakai |

## Non-secret Environment Variables

Non-secret variable boleh ada di Wrangler config atau environment deployment, tetapi tetap tidak boleh di-hardcode di source code.

| Variable | Required | Default | Notes |
|---|---:|---|---|
| `APP_ENV` | Yes | `development` | `development`, `staging`, `production` |
| `APP_NAME` | Yes | `Shopee Product Research AI` | Nama aplikasi |
| `APP_BASE_URL` | Yes | empty | URL frontend |
| `NINEROUTER_BASE_URL` | Yes | empty | Bootstrap fallback base URL 9router if D1 config is empty |
| `NINEROUTER_MODEL_PRIMARY` | Yes | configured in DB | Bootstrap fallback jika DB kosong |
| `NINEROUTER_MODEL_FAST` | No | configured in DB | Model cepat untuk extraction ringan |
| `NINEROUTER_MODEL_FALLBACK` | No | configured in DB | Model fallback |
| `JOB_POLL_INTERVAL_MS` | No | `3000` | Default polling frontend |
| `MAX_COMPARE_LINKS` | Yes | `5` | Maksimal link comparison |
| `KEYWORD_SEARCH_LIMIT` | Yes | `10` | Top result keyword search |
| `DEFAULT_SHIPPED_FROM` | Yes | `DKI Jakarta` | Default shipped from |

## Runtime Configuration Rule

Konfigurasi runtime yang dapat diubah admin tidak boleh di-hardcode dan harus disimpan di D1 table konfigurasi.

Contoh runtime config:

- Provider aktif.
- Model AI aktif.
- 9router base URL non-secret.
- Model primary, fast, fallback.
- Timeout AI.
- Retry count.
- Search provider priority.
- Browser Run enabled/disabled.
- Max compare links.
- Keyword search limit.
- Default shipped from.
- Scoring weight.

Secret value tetap tidak boleh disimpan di D1. D1 hanya menyimpan `secretRef`, bukan isi secret.

## Frontend CRUD Requirement

Harus ada halaman admin/settings untuk CRUD konfigurasi runtime:

- List configuration.
- Create configuration.
- Update configuration.
- Enable/disable configuration.
- Test AI provider/model.
- Test search provider.
- View last test status.

## Token Rotation Requirement

Karena token pernah ditulis di percakapan planning, token harus dianggap exposed dan harus di-rotate sebelum production deployment.
