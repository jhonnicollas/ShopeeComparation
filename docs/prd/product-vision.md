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
