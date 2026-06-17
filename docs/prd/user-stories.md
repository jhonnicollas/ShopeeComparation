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
