# Acceptance Criteria

## Global Acceptance

- Aplikasi berjalan sebagai Cloudflare-first app.
- Backend utama menggunakan Cloudflare Workers.
- Database utama menggunakan Cloudflare D1.
- Queue menggunakan Cloudflare Queues.
- Raw snapshot besar disimpan di R2.
- Mastra digunakan sebagai orchestrator.
- 9router digunakan sebagai AI gateway.
- Frontend menggunakan React + Vite.
- Monorepo menggunakan pnpm workspace.
- Validasi runtime menggunakan Zod.
- Table database wajib prefix `sh_`.
- Column database tidak boleh mengandung underscore.

## Auth

- User dapat register.
- User dapat login.
- User dapat logout.
- Password disimpan sebagai hash.
- Session token tidak disimpan plain text di database.
- Cookie session HttpOnly.
- User hanya dapat melihat data miliknya.

## Compare Links

- User dapat memasukkan 1–5 link Shopee.
- Sistem menolak input lebih dari 5 link.
- Sistem menghapus duplicate link.
- Sistem menerima full Shopee URL.
- Sistem menerima short URL `id.shp.ee`.
- Sistem menolak URL non-Shopee.
- Sistem membuat research session.
- Sistem membuat async job.
- Sistem menampilkan job progress.
- Sistem menampilkan result saat job selesai.

## URL Resolver

- Resolver menyimpan original URL.
- Resolver mencoba follow redirect.
- Resolver membersihkan tracking parameter.
- Resolver menghasilkan canonical URL jika berhasil.
- Resolver mengekstrak `shopId` dan `itemId` jika tersedia.
- Resolver memiliki fallback 9router web fetch.
- Resolver memiliki fallback Browser Run.
- Resolver tidak crash jika URL gagal di-resolve.

## Product Extraction

- Sistem mencoba mengambil title.
- Sistem mencoba mengambil price.
- Sistem mencoba mengambil product rating.
- Sistem mencoba mengambil review count.
- Sistem mencoba mengambil sold count.
- Sistem mencoba mengambil shipped from.
- Sistem mencoba mengambil description.
- Sistem mencoba mengambil specification.
- Sistem mencoba mengambil features.
- Sistem mencoba mengambil product weight.
- Field gagal tidak boleh diisi data palsu.
- Field gagal diberi confidence 0.

## Product Weight

- Setiap product result memiliki weight object.
- Weight object memiliki value, unit, rawText, source, confidence.
- Jika berat tidak ditemukan, value null dan confidence 0.
- AI boleh membantu ekstraksi dari text, tetapi tidak boleh mengarang.

## Shop Extraction

- Sistem mencoba mengambil shop name.
- Sistem mencoba mengambil shop status.
- Sistem mencoba mengambil shop rating.
- Sistem mencoba mengambil response rate.
- Sistem mencoba mengambil response time.
- Sistem mencoba mengambil follower count.
- Sistem mencoba mengambil product count.
- Sistem mencoba mengambil joined age.
- Sistem mencoba mengambil location.
- Shop status dinormalisasi.

## Keyword Search

- User dapat memasukkan keyword.
- Default shipped from adalah DKI Jakarta.
- Default limit adalah 10.
- Sistem mencari kandidat produk.
- Sistem melakukan deduplicate produk.
- Sistem filter atau prioritaskan DKI Jakarta.
- Sistem enrich produk kandidat.
- Sistem mengembalikan top 10 berdasarkan score.

## Scoring

- Score dihitung deterministic.
- Score berada di range 0–100.
- Score breakdown disimpan.
- Risk penalty diterapkan.
- AI tidak boleh menentukan score numeric bebas.

## AI Report

- AI report dibuat dari structured data.
- AI report menyebut produk terbaik.
- AI report menjelaskan alasan.
- AI report menyebut data yang tidak tersedia.
- AI report tidak boleh mengarang field kosong.
- AI output divalidasi schema.

## Job Progress

- Job memiliki status `pending`, `processing`, `completed`, `failed`, atau `partialSuccess`.
- Frontend polling job status.
- Job logs disimpan.
- Error ditampilkan user-friendly.
- Internal stacktrace tidak ditampilkan ke user.

## Compliance

- Sistem tidak login ke akun Shopee user.
- Sistem tidak akses cart.
- Sistem tidak akses checkout.
- Sistem tidak akses order.
- Sistem tidak akses halaman user/me.
- Sistem tidak bypass CAPTCHA.
- Sistem tidak scraping agresif.
# MVP Scope

## MVP Full Feature Definition

MVP tetap memiliki fitur penuh untuk dua workflow utama:

1. Keyword Search Top 10.
2. Compare maksimal 5 link Shopee.

Yang dibatasi bukan fitur inti, tetapi volume, jumlah link, jumlah hasil, dan fitur tambahan yang belum urgent.

## Included in MVP

- Multi-user auth.
- Compare 1–5 Shopee links.
- Short URL resolver.
- Product extraction.
- Shop extraction.
- Product weight extraction.
- Feature extraction.
- Deterministic scoring.
- Risk detection.
- AI report via Mastra + 9router.
- Keyword search top 10.
- Default shipped from DKI Jakarta.
- Async job processing.
- Research history.
- Job logs.

## Excluded from MVP

- Price tracking.
- Price drop alert.
- Browser extension.
- Mobile native app.
- Payment/subscription.
- Marketplace selain Shopee.
- Auto-buy.
- Checkout integration.
- Shopee user login.
- Cart/order/user scraping.
- CAPTCHA bypass.
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
# Product Vision — Shopee Product Research AI

## Visi Produk

Shopee Product Research AI adalah aplikasi web yang membantu user menemukan dan membandingkan produk terbaik dari Shopee.co.id secara cepat, objektif, dan berbasis data.

Aplikasi ini menggantikan proses manual user yang sebelumnya harus membuka Shopee, mengecek produk satu per satu, membuka short URL secara manual, lalu bertanya ke ChatGPT untuk setiap produk.

## Nilai Utama

1. Menghemat waktu riset produk.
2. Membandingkan produk secara objektif.
3. Menggabungkan data produk, data toko, harga, rating, review, total terjual, fitur, berat produk, dan reputasi toko.
4. Menghasilkan ranking produk terbaik.
5. Memberikan report naratif AI yang menjelaskan alasan rekomendasi.
6. Menyimpan history riset untuk digunakan ulang.

## Positioning

Aplikasi ini bukan sekadar scraper. Aplikasi ini adalah **AI-assisted Shopee product research platform**.

Sistem harus menempatkan data sebagai dasar utama dan AI sebagai lapisan penjelasan. Scoring tidak boleh sepenuhnya ditentukan oleh AI.

## Prinsip Produk

1. Data first, AI second.
2. AI explains, scoring decides.
3. Jangan mengarang data yang tidak tersedia.
4. Semua field penting harus memiliki source dan confidence.
5. Job berat harus async.
6. D1 hanya untuk structured data.
7. R2 untuk raw snapshot dan file besar.
8. Mastra mengatur workflow, bukan menggantikan business logic.
9. MVP harus menjadi production foundation, bukan prototype buangan.

## Target MVP

MVP harus mendukung dua workflow utama:

1. Keyword Search Top 10 dengan filter utama Shipped From DKI Jakarta.
2. Compare maksimal 5 link Shopee, termasuk short URL.

## Batasan Produk

MVP tidak menangani:

1. Auto-buy.
2. Checkout integration.
3. Login ke akun Shopee user.
4. Akses cart, checkout, order, atau halaman private Shopee.
5. Bypass CAPTCHA.
6. Scraping agresif.
7. Tracking harga berkala.
8. Alert harga turun.
9. Browser extension.
10. Payment/subscription.
# User Stories

## Epic 1 — Authentication

### US-001 Register

Sebagai user, saya ingin membuat akun agar hasil riset produk saya dapat disimpan dan dibuka kembali.

Acceptance:

- User dapat register dengan email dan password.
- Email harus valid.
- Password harus memenuhi minimum security rule.
- Password tidak boleh disimpan dalam bentuk plain text.
- Setelah register berhasil, user dapat login.

### US-002 Login

Sebagai user, saya ingin login agar dapat mengakses dashboard dan history riset saya.

Acceptance:

- User dapat login dengan email dan password.
- Session dibuat dalam cookie aman.
- User yang belum login tidak dapat mengakses protected page.

### US-003 Logout

Sebagai user, saya ingin logout agar session saya tidak bisa digunakan lagi.

Acceptance:

- Session aktif dicabut.
- Cookie session dihapus.
- User diarahkan ke login page.

## Epic 2 — Compare Links

### US-010 Compare maksimal 5 link Shopee

Sebagai user, saya ingin memasukkan maksimal 5 link produk Shopee agar sistem dapat membandingkan produk tersebut.

Acceptance:

- User dapat paste 1–5 link.
- Sistem menolak lebih dari 5 link.
- Duplicate link dibersihkan.
- Link pendek `id.shp.ee` diterima.
- Link non-Shopee ditolak.

### US-011 Resolve short URL

Sebagai user, saya ingin short URL Shopee diubah otomatis menjadi URL produk asli agar saya tidak perlu membuka link di browser secara manual.

Acceptance:

- Sistem menyimpan original URL.
- Sistem mencoba mendapatkan canonical URL.
- Sistem mengekstrak `shopId` dan `itemId` jika tersedia.
- Jika gagal, sistem menampilkan error yang jelas.

### US-012 Product comparison table

Sebagai user, saya ingin melihat tabel perbandingan agar mudah memilih produk terbaik.

Acceptance:

- Tabel menampilkan nama produk, nama toko, dikirim dari, harga, berat, fitur, total review, total item terjual, rating produk, status toko, rating toko, response rate, response time, risk level, dan recommendation.
- Setiap produk memiliki final score.
- Produk terbaik ditandai jelas.

## Epic 3 — Keyword Search

### US-020 Cari produk dari keyword

Sebagai user, saya ingin memasukkan keyword agar sistem dapat mencari produk terbaik dari Shopee.

Acceptance:

- User dapat memasukkan keyword.
- Default shipped from adalah DKI Jakarta.
- Default limit adalah 10 produk.
- Sistem membuat job async.
- User dapat melihat progress.

### US-021 Top 10 ranking

Sebagai user, saya ingin mendapatkan ranking top 10 agar tidak perlu membandingkan hasil search Shopee secara manual.

Acceptance:

- Sistem menghasilkan maksimal 10 produk.
- Produk difilter atau diprioritaskan berdasarkan DKI Jakarta.
- Produk diurutkan berdasarkan final score.
- Produk dengan data tidak lengkap diberi confidence note.

## Epic 4 — Product Data

### US-030 Data produk maksimal

Sebagai user, saya ingin sistem mengambil data produk sebanyak mungkin agar keputusan pembelian lebih akurat.

Acceptance:

- Sistem mencoba mengambil harga, rating, review count, sold count, fitur, spesifikasi, deskripsi, brand, kategori, shipped from, dan gambar.
- Data kosong disimpan sebagai null.
- Sistem tidak boleh mengarang data.

### US-031 Berat produk

Sebagai user, saya ingin melihat berat produk karena berat dapat memengaruhi ongkir dan kualitas persepsi barang.

Acceptance:

- Setiap produk memiliki object berat.
- Jika berat ditemukan, value, unit, rawText, source, dan confidence disimpan.
- Jika berat tidak ditemukan, value null dan confidence 0.

## Epic 5 — Shop Intelligence

### US-040 Data toko

Sebagai user, saya ingin melihat reputasi toko agar tidak hanya memilih berdasarkan harga.

Acceptance:

- Sistem mencoba mengambil nama toko, status toko, rating toko, response rate, response time, follower, jumlah produk, lama bergabung, dan lokasi toko.
- Status toko dinormalisasi.
- Jika data toko tidak tersedia, sistem menandai partial data.

## Epic 6 — Scoring dan Risk

### US-050 Score objektif

Sebagai user, saya ingin produk diberi score objektif agar rekomendasi tidak hanya berdasarkan opini AI.

Acceptance:

- Final score dihitung oleh scoring engine deterministic.
- Score berada di range 0–100.
- Score breakdown tersedia.
- Risk penalty diterapkan jika ada red flag.

### US-051 Risk detection

Sebagai user, saya ingin melihat red flag agar saya tahu produk mana yang perlu dihindari.

Acceptance:

- Sistem menampilkan risk type, severity, message, dan impact.
- Produk dengan banyak red flag turun ranking.

## Epic 7 — AI Report

### US-060 AI recommendation report

Sebagai user, saya ingin report naratif agar hasil perbandingan mudah dipahami.

Acceptance:

- Report menyebut produk terbaik.
- Report menjelaskan alasan.
- Report menyebut missing data.
- Report tidak mengarang data.
- Report dibuat dari structured data.

## Epic 8 — History dan Job

### US-070 Research history

Sebagai user, saya ingin melihat history riset agar hasil sebelumnya bisa dibuka kembali.

Acceptance:

- User melihat daftar riset miliknya.
- User dapat membuka detail riset.
- User tidak dapat membuka riset user lain.

### US-071 Job progress

Sebagai user, saya ingin melihat progress job agar tahu proses masih berjalan.

Acceptance:

- Job punya status.
- Frontend melakukan polling.
- Progress current dan total ditampilkan.
- Error ditampilkan user-friendly.

## Epic 9 — Admin

### US-080 Admin job monitoring

Sebagai admin, saya ingin melihat job dan error log agar bisa memperbaiki extraction failure.

Acceptance:

- Admin dapat melihat failed jobs.
- Admin dapat melihat job logs.
- Admin dapat melihat error code tanpa secret/internal stacktrace.
