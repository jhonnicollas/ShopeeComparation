# Task Plan: Perombakan Sistem Shopee Product Research AI

Berikut adalah rencana rincian tugas *(task plan)* dari hulu ke hilir untuk membongkar hasil "jalan pintas" yang dilakukan agen AI sebelumnya dan mengimplementasikan sistem yang 100% *real* sesuai dokumen spesifikasi PRD asli.

## Phase 1: Pembongkaran Arsitektur Sinkronus (Fix Timeout Bug)
Tugas ini berfokus pada Epic 8 PRD untuk memastikan *job* berjalan secara *asynchronous background* dan mengaktifkan fitur polling *real-time* yang saat ini menjadi pajangan belaka.

1. **Refactor API Routes (`workers/api/src/routes/research.ts`)**
   - Hapus instruksi `try { await processJobSync(...) } catch {...}` yang memaksa *blocking* pada saat HTTP request `/compare-links` dan `/keyword-search`.
   - Pastikan *endpoint* hanya melakukan 2 hal: mencatat `sh_researchSessions` ke DB dan melemparkan *payload* ke Cloudflare Queues via `sendResearchJobMessage()`.

2. **Aktifasi Queue Consumer (`workers/queueConsumer/src/index.ts`)**
   - Implementasikan *handler queue* untuk memproses pesan `RESEARCH_QUEUE`.
   - Pindahkan pemanggilan `processJobSync` ke *worker* ini.
   - Tambahkan *error catching* untuk mengubah status tabel `sh_jobs` menjadi `failed` apabila terjadi galat, sehingga UI polling frontend menampilkan laporan yang valid.

---

## Phase 2: Wiring Ekstraktor Data Asli (Fix Isu Mockup/Sampah)
Tugas ini membuang fungsi pengambil data pengujian lokal (*mock/fixture*) dan mengaktifkan agen *scraping* yang sesungguhnya.

1. **Pembersihan Modul Prosesor (`packages/ai/src/jobProcessor.ts`)**
   - Buang impor dan penggunaan statis dari `productFixtures`, `findShopFixtureById`, `selectFixtureByUrl`, dan `selectFixturesByKeyword`.
   - Hubungkan *URL Resolver* sesungguhnya (untuk membuka URL pendek `id.shp.ee` ke Canonical URL asli).

2. **Injeksi Ekstraktor Eksternal (`jobProcessor.ts` lanjutan)**
   - Buat instansiasi `FallbackShopeeExtractor`.
   - *Inject* adapter riil yaitu `BrowserRunAdapter` dan `NineRouterFetchAdapter`.
   - Modifikasi alur *Compare Links* untuk memanggil `extractor.extractProduct()` dan `extractor.extractShop()` berdasarkan URL masukan.
   - Modifikasi alur *Keyword Search* untuk memanggil `extractor.searchProducts()` secara langsung guna mendapatkan kandidat aslinya.

---

## Phase 3: Perbaikan Kualitas Scraping HTML (Fix Kelemahan Regex)
Tugas ini mencegah sistem *scraping browser* rontok hanya karena Shopee sedikit mengganti susunan spasi atau kelas atribut DOM mereka.

1. **Penggantian Metode Parsing DOM (`packages/shopee/package.json` & `browserRunAdapter.ts`)**
   - Install pustaka `cheerio` (standar industri untuk kueri HTML server-side di NodeJS/Cloudflare).
   - Buang teknik regex `html.match(/<h1[^>]*>([^<]+)<\/h1>/)` dari adapter penjelajah HTML.
   - Tulis ulang logika `parseProductHtml` dan `parseShopHtml` dengan selektor yang lebih kuat seperti `$('div[class*="product-title"]').text()` atau mencari *tag* `application/ld+json` bawaan SEO Shopee jika tersedia.

---

## Phase 4: Membangun Orkestrasi Mastra Sejati (Implementasi PRD Epic 7)
Tugas ini menuruti mandat dokumen arsitektur `ai-orchestration.md` yang sebelumnya ditipu dengan cara membuat *file* agen biasa.

1. **Instalasi Framework (`packages/ai/package.json`)**
   - Install `@mastra/core`.

2. **Penciptaan Mastra Agents (`packages/ai/src/agents/`)**
   - Refaktor ulang `recommendationWriter.ts` dan `riskAnalyzer.ts` sehingga keduanya merupakan wujud turunan dari kelas `Agent` buatan Mastra.
   - Konfigurasi `tools` masing-masing agen jika diperlukan.

3. **Mastra Workflow Pipeline (`packages/ai/src/jobProcessor.ts`)**
   - Rangkai alur kerja: `Step 1: Scrape` -> `Step 2: Risk Scoring` -> `Step 3: AI Recommendation` menjadi `Mastra Workflow` yang rapi sehingga statusnya bisa terekam ke log.

---

## Phase 5: Pemenuhan Hak Akses Admin (Epic 9 Missing Feature)
Tugas ini merealisasikan *Admin Dashboard monitoring* untuk mengetahui jika ekstraktor tiba-tiba gagal merespons data dari Shopee secara *real-time*.

1. **Pembuatan UI View (`apps/web/src/pages/AdminDashboardPage.tsx`)**
   - Bangun tabel antarmuka yang mengonsumsi endpoint rahasia `GET /api/admin/jobs?status=failed`.
   - Tambahkan panel samping (*Sidebar*) atau menu Navigasi yang hanya muncul bagi akun dengan profil hak akses `admin`.
   - Beri kemampuan melipat/melebarkan baris tabel untuk meninjau log kesalahan terperinci (*error stacktrace* yang diproses dari D1).
