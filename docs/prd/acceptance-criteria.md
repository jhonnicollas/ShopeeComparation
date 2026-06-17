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

- Job memiliki status pending, processing, completed, failed, atau partial success.
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
