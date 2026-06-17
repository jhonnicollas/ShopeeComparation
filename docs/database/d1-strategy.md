# D1 and R2 Strategy

## D1 Role

D1 adalah database utama untuk structured data.

D1 menyimpan:

- users
- sessions
- research sessions
- product summary
- shop summary
- weight data
- feature data
- comparisons
- score breakdown
- AI report summary
- job status
- job logs

## R2 Role

R2 menyimpan data besar:

- raw HTML
- raw JSON
- screenshot
- browser render output
- large AI raw response
- debug snapshot
- product image cache jika diperlukan

## Why Not Store Raw Data in D1

Raw data dapat membuat D1 cepat penuh dan query menjadi lambat. Semua data besar wajib masuk R2. D1 hanya menyimpan `rawSnapshotR2Key` atau `rawResponseR2Key`.

## Retention Policy

MVP default:

- Research result: disimpan permanen sampai user hapus.
- Job logs: 30 hari.
- Raw snapshot: 14 sampai 30 hari.
- AI raw response: 30 hari.

## Data Confidence

Setiap data hasil extraction harus punya confidence:

| Confidence | Meaning |
|---:|---|
| 0 | Tidak tersedia |
| 0.1 sampai 0.4 | Lemah |
| 0.5 sampai 0.7 | Cukup |
| 0.8 sampai 1.0 | Kuat |

## D1 Naming Requirement

- Table wajib prefix `sh_`.
- Column tidak boleh memakai underscore.
- Column memakai camelCase.
