# PRD — Shopee Product Research AI

## 1. Product Name

**Shopee Product Research AI**

Alternatif nama:

- Shopee Best Product Finder
- Shopee Product Comparator AI
- Shopee Research Assistant
- BestBuy Shopee AI

## 2. Product Summary

Shopee Product Research AI adalah aplikasi web multi-user berbasis Cloudflare-first yang membantu user mencari dan membandingkan produk terbaik dari Shopee.co.id.

Aplikasi memiliki dua workflow utama:

1. **Keyword Search Top 10** — user memasukkan keyword produk dan filter `Shipped From = DKI Jakarta`, lalu sistem mencari dan menampilkan 10 produk terbaik.
2. **Compare Links** — user memasukkan maksimal 5 link produk Shopee, termasuk short URL `id.shp.ee/...`, lalu sistem membandingkan produk tersebut dan menentukan rekomendasi terbaik.

Aplikasi menggunakan **Mastra AI Orchestrator** untuk mengatur workflow pencarian, extraction, scoring, risk analysis, dan AI report. Model AI dipanggil melalui **9router**.

## 3. Goals

1. Mengurangi proses manual saat membandingkan produk Shopee.
2. Menyediakan ranking objektif berdasarkan data produk dan toko.
3. Menyediakan report AI yang berbasis data, bukan asumsi.
4. Menyimpan history riset per user.
5. Mendukung workflow async agar proses berat tidak memblokir request utama.
6. Menjadi production foundation yang tetap bisa dikembangkan setelah MVP.

## 4. Problem Statement

User saat ini harus membuka Shopee, copy link produk, membuka short URL di browser, mengambil URL final, lalu bertanya ke ChatGPT satu per satu. Proses ini lambat, tidak reusable, tidak punya history, dan tidak memiliki scoring objektif.

Masalah utama:

1. Link pendek Shopee tidak selalu bisa dibaca langsung.
2. Data produk dan toko tersebar di beberapa halaman.
3. Produk dengan rating tinggi belum tentu terbaik.
4. Produk murah belum tentu aman.
5. Berat produk sering penting tetapi tidak selalu mudah ditemukan.
6. User membutuhkan tabel dan report naratif yang mudah dipahami.

## 5. Target User

### 5.1 Regular User

User yang ingin membeli produk terbaik di Shopee dan ingin membandingkan sebelum membeli.

### 5.2 Power User

User yang sering melakukan riset produk random dari berbagai kategori seperti elektronik, alat kesehatan, perlengkapan rumah, gadget, sparepart, fashion, dan produk UMKM.

### 5.3 Admin

Admin yang memantau user, job, extraction failure, AI workflow, queue status, dan error log.

## 6. MVP Scope

MVP tetap memiliki fitur penuh untuk dua workflow utama:

1. Keyword Search Top 10.
2. Compare maksimal 5 link Shopee.

MVP tidak berarti prototype buangan. MVP adalah production foundation dengan scope terbatas.

## 7. Technical Decisions

Dokumen ini adalah keputusan teknis yang dikunci untuk MVP. AI agent tidak boleh mengubah keputusan ini tanpa membuat ADR baru dan mendapat approval.

| # | Keputusan | Pilihan Final | Impact |
|---:|---|---|---|
| 1 | Framework frontend | **React + Vite + TanStack Router + TanStack Query** | Menentukan seluruh `apps/web`. Aplikasi dibuat sebagai SPA yang memanggil Cloudflare Workers API. Tidak memakai SSR agar deployment Cloudflare lebih sederhana. |
| 2 | Package manager | **pnpm + pnpm workspace** | Menentukan monorepo setup, script lint/typecheck/test/build, dan dependency management lintas apps/packages. |
| 3 | ID generation strategy | **nanoid + entity prefix** | Semua entity memakai ID string prefixed, misalnya `usr_`, `ses_`, `rsr_`, `prd_`, `shp_`, `cmp_`, `job_`. ID dibuat di application layer, bukan auto increment. |
| 4 | Auth implementation | **Email/password + WebCrypto PBKDF2-SHA-256 + opaque session cookie** | Menentukan `TASK-017`. Password di-hash dengan salt unik dan iterasi configurable. Session memakai token acak, token disimpan sebagai hash di D1, cookie `shSession` HttpOnly/Secure/SameSite=Lax. |
| 5 | 9router configuration | **D1 runtime config with env secret/bootstrap fallback** | Provider, model, timeout, dan retry policy dimuat dari D1 config tables. Environment variables hanya untuk secret values dan safe bootstrap fallback saat D1 belum memiliki config. |
| 6 | Job progress transport | **Polling, bukan WebSocket** | Menentukan frontend architecture. Frontend poll `GET /api/jobs/:id` dengan interval adaptif. WebSocket ditunda agar Cloudflare Worker, D1, dan Queue lebih sederhana. |
| 7 | Shopee search strategy | **Adapter-based extraction: official API jika tersedia, fallback scrape terbatas** | Menentukan `TASK-060–065`. Strategi urutan: official/affiliate API jika ada → fetch ringan → 9router web fetch → Browser Run → optional VPS scraper. Tidak login, tidak bypass CAPTCHA, tidak akses cart/checkout/order/user. |
| 8 | Validation library | **Zod** | Menentukan `packages/shared`. Semua request API, response extractor, output AI, dan contract internal divalidasi dengan Zod. |
| 9 | Backend utama | **Cloudflare Workers** | API utama, queue consumer, Mastra workflow ringan, dan endpoint job status berada di Cloudflare. |
| 10 | Database utama | **Cloudflare D1** | D1 menyimpan data structured. Raw HTML, raw JSON, screenshot, dan response AI besar masuk R2. |
| 11 | Queue | **Cloudflare Queues** | Semua job berat diproses async. Request utama hanya membuat research session dan job. |
| 12 | Object storage | **Cloudflare R2** | Menyimpan snapshot besar, raw response, dan debug artifact agar D1 tetap ringan. |
| 13 | AI orchestration | **Mastra** | Mastra mengatur workflow dan agent; scoring tetap deterministic di `packages/core`. |
| 14 | Database naming | **Table prefix `sh_`, column camelCase tanpa underscore** | Semua table wajib diawali `sh_`. Semua column **tidak boleh mengandung `_`**. Column menggunakan camelCase. |

## 8. In Scope

### 8.1 Authentication

Fitur:

- Register
- Login
- Logout
- Session management
- Protected route
- User-specific research history

Implementation decision:

- Email/password.
- Password hashing memakai WebCrypto PBKDF2-SHA-256.
- Session token opaque disimpan sebagai hash di D1.
- Cookie `shSession` HttpOnly, Secure, SameSite=Lax.

### 8.2 Multi-user

Setiap user memiliki:

- Research history sendiri.
- Comparison sendiri.
- Job status sendiri.
- AI report sendiri.

User tidak boleh mengakses data user lain.

### 8.3 Keyword Search Top 10

Input:

- Keyword produk.
- Shipped From default `DKI Jakarta`.
- Limit default `10`.
- Optional price range.
- Optional minimum rating.
- Optional store status.

Output:

- Ranking 1–10 produk terbaik.
- Tabel produk.
- Tabel toko.
- Score breakdown.
- Berat produk.
- Fitur utama.
- Red flag.
- AI recommendation report.

### 8.4 Compare Links

Input:

- 1 sampai 5 link Shopee.
- Full Shopee product URL.
- Short URL `id.shp.ee/...`.
- URL dengan tracking parameter.

Output:

- Produk terbaik.
- Ranking semua produk.
- Comparison table.
- Shop comparison.
- Weight comparison.
- Feature comparison.
- Score breakdown.
- AI report.

### 8.5 Shopee Short URL Resolver

Resolver harus melakukan:

1. Validasi URL.
2. Follow HTTP redirect.
3. Normalize canonical URL.
4. Extract `shopId` dan `itemId`.
5. Fallback ke 9router web fetch jika perlu.
6. Fallback ke Browser Run jika perlu.
7. Return error jelas jika gagal.

### 8.6 Product Data Extraction

Data produk yang harus dicoba diambil:

- Product ID.
- Shop ID.
- Nama produk.
- Canonical URL.
- Harga minimum dan maksimum.
- Rating produk.
- Total review.
- Total item terjual.
- Gambar.
- Kategori.
- Brand.
- Varian.
- Fitur.
- Spesifikasi.
- Deskripsi.
- Berat produk.
- Dimensi jika tersedia.
- Garansi jika tersedia.
- Lokasi pengiriman.
- Confidence score.

Jika data tidak ditemukan, sistem wajib menyimpan `null`, `confidence = 0`, dan tidak boleh mengarang.

### 8.7 Product Weight Extraction

Berat produk wajib menjadi field khusus.

Sumber extraction:

1. Spesifikasi produk.
2. Deskripsi produk.
3. Metadata halaman.
4. Informasi varian.
5. Informasi shipping jika tersedia.
6. AI extraction dari text jika pattern ditemukan.

Output:

```json
{
  "value": 500,
  "unit": "gram",
  "rawText": "Berat: 500g",
  "source": "productSpecification",
  "confidence": 0.92
}
```

### 8.8 Shop Data Extraction

Data toko yang harus dicoba diambil:

- Shop ID.
- Nama toko.
- URL toko.
- Status toko.
- Shopee Mall.
- Official Store.
- Star Seller.
- Star+.
- Rating toko.
- Jumlah rating toko.
- Response rate.
- Response time.
- Jumlah follower.
- Jumlah produk.
- Lama bergabung.
- Lokasi toko.
- Confidence score.

Status toko dinormalisasi menjadi:

- `MALL`
- `OFFICIAL`
- `STAR`
- `STARPLUS`
- `PREFERRED`
- `REGULAR`
- `UNKNOWN`

### 8.9 Scoring Engine

Scoring harus deterministic. AI tidak boleh menentukan angka score bebas.

Default weight:

| Komponen | Bobot |
|---|---:|
| Product rating | 15% |
| Review count | 15% |
| Sold count | 15% |
| Price competitiveness | 15% |
| Shop trust | 20% |
| Response rate | 10% |
| Feature match | 10% |
| Risk penalty | sampai -30 |

Score final range `0–100`.

### 8.10 AI Recommendation Report

Report harus berisi:

1. Produk terbaik.
2. Alasan utama.
3. Ranking produk.
4. Produk value-for-money.
5. Produk paling aman.
6. Produk paling berisiko.
7. Kelebihan dan kekurangan setiap produk.
8. Red flag.
9. Confidence.
10. Catatan data tidak tersedia.

AI hanya boleh membaca structured data.

## 9. Out of Scope MVP

1. Tracking harga berkala.
2. Alert harga turun.
3. Browser extension.
4. Mobile app native.
5. Subscription/payment.
6. Marketplace selain Shopee.
7. Auto-buy.
8. Checkout integration.
9. Login Shopee user.
10. Akses cart, checkout, order, user, atau me page Shopee.
11. Bypass CAPTCHA.
12. Scraping agresif.

## 10. User Stories

Full user stories ada di `docs/prd/user-stories.md`.

Ringkasan:

- Sebagai user, saya ingin login agar hasil riset saya tersimpan.
- Sebagai user, saya ingin mencari 10 produk terbaik dari keyword.
- Sebagai user, saya ingin filter berdasarkan `DKI Jakarta`.
- Sebagai user, saya ingin membandingkan maksimal 5 link Shopee.
- Sebagai user, saya ingin short URL Shopee di-resolve otomatis.
- Sebagai user, saya ingin melihat berat produk.
- Sebagai user, saya ingin melihat tabel perbandingan dan report AI.
- Sebagai admin, saya ingin melihat job dan error log.

## 11. Acceptance Criteria

Full acceptance criteria ada di `docs/prd/acceptance-criteria.md`.

MVP diterima jika:

1. User dapat register, login, logout.
2. User dapat compare maksimal 5 link Shopee.
3. User dapat keyword search top 10 dengan filter default DKI Jakarta.
4. Sistem dapat resolve short URL jika memungkinkan.
5. Sistem dapat mengambil data produk dan toko.
6. Sistem memiliki object berat produk walaupun data tidak ditemukan.
7. Sistem menghitung score deterministic.
8. Sistem membuat AI report berbasis data.
9. Sistem menyimpan history riset.
10. Sistem menampilkan status job async.

## 12. Success Metrics

1. Compare 5 link accepted dalam kurang dari 3 detik.
2. Keyword search job accepted dalam kurang dari 3 detik.
3. Hasil compare ideal selesai dalam 2–5 menit.
4. Hasil keyword search ideal selesai dalam 3–8 menit.
5. Partial failure tidak menyebabkan seluruh job crash.
6. AI report tidak mengarang field yang kosong.
7. D1 hanya menyimpan structured data.
8. R2 menyimpan raw snapshot besar.

## Runtime Configuration and Admin CRUD Requirement

Semua konfigurasi aplikasi harus configurable, tidak boleh di-hardcode.

Konfigurasi yang wajib disimpan di D1 dan dapat dikelola dari frontend admin/settings:

1. App config.
2. AI provider config.
3. AI model config.
4. Search provider config.
5. Scoring config.
6. Feature flags.
7. Timeout and retry policy.
8. Job polling interval.
9. Keyword search limit.
10. Default shipped from.

Secret value tidak boleh disimpan di D1. D1 hanya menyimpan `secretRef`, sedangkan secret value disimpan di Cloudflare secret atau CI/CD secret store.

Runtime configuration precedence:

1. D1 active config row.
2. Safe environment bootstrap default.
3. Built-in development fallback only for non-secret local bootstrap.

### Required Configuration UI

Aplikasi harus menyediakan frontend CRUD untuk konfigurasi:

- Create config.
- Read config.
- Update config.
- Disable config.
- Test provider.
- Test model.
- View last test result.

### Provider and AI Model Requirement

Provider AI default adalah `9router`.

Model AI tidak boleh di-hardcode. Model harus disimpan dalam `sh_aiModelConfigs` dan bisa diubah dari frontend.

Frontend admin harus bisa:

1. Menambahkan model baru.
2. Mengubah model primary.
3. Mengubah model fast.
4. Mengubah model fallback.
5. Test model dari UI.
6. Melihat response test.
7. Melihat latency test.
8. Melihat status sukses/gagal.

### Search Provider Requirement

Strategi pencarian Shopee harus disimpan di `sh_searchProviderConfigs` dan bisa diubah dari frontend.

Default priority:

1. Official or affiliate API jika tersedia.
2. Lightweight web fetch.
3. 9router web fetch.
4. Cloudflare Browser Run.
5. Optional VPS scraper fallback.

Tidak boleh membuat search provider secara hardcoded tanpa entry konfigurasi di D1.

### Cloudflare Resource Requirement

Project tidak boleh membuat D1 database baru untuk MVP. Gunakan resource berikut:

- D1 binding: `DB`
- D1 database name: `multi_Ai_db`
- D1 database ID: `b80ca989-6771-427f-a656-c7ab6ffc17ce`
- R2 binding: `LOGS`
- R2 bucket: `multi-apps-ai-bucket`

Cloudflare account ID: `79dea2845a4b62ea5229c8676dea02c0`.

Cloudflare API token harus disimpan sebagai secret dan tidak boleh ditulis di repo.
