# Database Naming Rules

## Table Names

- Semua table wajib memiliki prefix `sh_`.
- Setelah prefix, gunakan camelCase atau plural noun.
- Contoh valid:
  - `sh_users`
  - `sh_researchSessions`
  - `sh_productWeights`
  - `sh_comparisonItems`

## Column Names

- Column tidak boleh mengandung underscore.
- Column menggunakan camelCase.
- Contoh valid:
  - `passwordHash`
  - `createdAt`
  - `researchSessionId`
  - `rawSnapshotR2Key`

Contoh tidak valid:

- `password_hash`
- `created_at`
- `research_session_id`
- `raw_snapshot_r2_key`

## ID Values

ID value menggunakan prefixed nanoid:

| Entity | Prefix | Example |
|---|---|---|
| User | `usr_` | `usr_abc123` |
| Session | `ses_` | `ses_abc123` |
| Research session | `rsr_` | `rsr_abc123` |
| Product | `prd_` | `prd_abc123` |
| Shop | `shp_` | `shp_abc123` |
| Comparison | `cmp_` | `cmp_abc123` |
| Comparison item | `cim_` | `cim_abc123` |
| Job | `job_` | `job_abc123` |
| Job log | `log_` | `log_abc123` |
| AI report | `air_` | `air_abc123` |
| Raw snapshot | `raw_` | `raw_abc123` |
| Field evidence | `evd_` | `evd_abc123` |

Underscore pada ID value diperbolehkan karena aturan larangan underscore hanya berlaku untuk **nama column**.
