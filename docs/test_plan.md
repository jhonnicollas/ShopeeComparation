# Test Plan: Verifikasi Remediasi Shopee Product Research AI

Dokumen ini merinci pengujian berlapis *(layered test plan)* untuk menjamin bahwa seluruh fitur yang dijabarkan dalam *Task Plan* telah diimplementasikan dengan sempurna dan sesuai dengan batasan lingkungan berjejaring asli tanpa ada data statis "siluman".

---

## 1. Uji Modul Infrastruktur Asinkron (Phase 1)
Menguji kehandalan Cloudflare Queue dan penghilangan sifat bloking pada API HTTP.

- **[TC-101] Verifikasi Respons Singkat (Timeout Prevention)**
  - *Tindakan:* Hit `POST /api/research/keyword-search` melalui `curl` atau Postman dengan *keyword* "sepatu".
  - *Ekspektasi:* API membalas `HTTP 200 OK` (dengan sebuah `jobId`) dalam waktu di bawah 1 detik tanpa menunggu pencarian selesai.
- **[TC-102] Verifikasi Eksekusi Background Queue**
  - *Tindakan:* Memantau terminal `wrangler dev` (Workers).
  - *Ekspektasi:* Muncul log dari `queueConsumer` yang berbunyi `[Queue] Processing job <jobId>` sesaat setelah API membalas `HTTP 200`.

---

## 2. Uji Integritas Ekstraktor Asli (Phase 2 & Phase 3)
Menguji pembongkaran data pengujian fiktif *(mock data)*, dan mengecek ketangguhan `Cheerio`.

- **[TC-201] Validasi Ekstraktor Non-Mockup**
  - *Tindakan:* Mencari keyword langka yang sangat sepesifik (misal: "kabel data tronsmart c-to-c 2 meter").
  - *Ekspektasi:* Muncul 10 barang asli Shopee dengan foto, nama toko, dan rating yang jika diklik ke tautannya, datanya sama persis seperti apa yang ditampilkan aplikasi. Bukan data "tensimeter" atau barang uji coba buatan sistem.
- **[TC-202] Validasi Kegagalan Scraper (HTML Parser Resilience)**
  - *Tindakan:* Memberikan tautan ke `browserRunAdapter` di mana susunan DOM halaman tersebut sengaja dirusak (atau menggunakan URL produk Shopee yang dihapus / *Product Not Found*).
  - *Ekspektasi:* Pemroses DOM (`Cheerio`) tidak mengalami *crash* tipe data `null pointer exception`, melainkan mengembalikan nilai kosong yang rapi (dengan skor `confidence = 0`) tanpa mematikan Worker utamanya.

---

## 3. Uji Orkestrasi Mastra Workflow (Phase 4)
Memastikan agen AI Recommendation tidak lagi bekerja sebagai fungsi mentah.

- **[TC-301] Validasi Eksekusi Step Mastra**
  - *Tindakan:* Melakukan operasi *Compare Links* dari UI (masukkan 2 tautan produk berbeda).
  - *Ekspektasi:* Pada konsol server, *Mastra Logger* menelusuri eksekusi secara berurutan: menyelesaikan `scrapingStep`, meneruskan struktur produk ke `riskStep`, dan memfinalisasi dengan `recommendationWriterStep`. Laporan yang dihasilkan bukan fiktif, melainkan merujuk langsung pada perbedaan spesifikasi antara 2 tautan produk terkait.

---

## 4. Uji Verifikasi Panel Admin (Phase 5)
Menguji fitur US-080 yang hilang untuk keperluan memonitor sistem.

- **[TC-401] Pemisahan Hak Akses Dasbor**
  - *Tindakan:* Masuk menggunakan kredensial berlevel *User* ke `http://localhost:3000/admin`.
  - *Ekspektasi:* Muncul halaman galat *Forbidden* atau otomatis dialihkan ke Beranda (*Home*).
- **[TC-402] Rekaman Pekerjaan Gagal (Failed Jobs Listing)**
  - *Tindakan:* Masuk dengan kredensial *Admin*. Dengan sengaja mematikan atau memblokir koneksi internet *Worker* (*disable network*), lalu memicu *Keyword Search* baru.
  - *Ekspektasi:* Rute `queueConsumer` membatalkan *job* tersebut. Dasbor Admin (melalui *polling* `GET /api/admin/jobs?status=failed`) memunculkan baris *job* tersebut beserta galat aslinya (misalnya `Network Connection Error` atau `Target HTML Invalid`).

---

## 5. End-to-End (E2E) Flow User Assurance
Mengetes bagaimana pengguna akhir *(User)* merasakan perbaikannya di lingkungan simulasi riil.

- **[TC-501] E2E Simulasi Pekerjaan Berat Polling UI**
  - *Tindakan:* Buka halaman pencarian, cari "meja lipat", lalu segera amati layar.
  - *Ekspektasi:* Bilah *Progress UI* (*Polling Bar*) harus merespons secara wajar. Muncul tahapan proses yang tidak selesai dalam sekedipan mata (misal "Mengekstraksi 4 dari 10 tautan...", lalu berlanjut ke "AI sedang menganalisa data..."). *Feedback* ini membuktikan aplikasi benar-benar bekerja memproses jaringan asli Shopee dan merespons sistem antrean dengan benar.
