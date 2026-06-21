# Runtime Configuration

## Purpose

Runtime configuration adalah konfigurasi aplikasi yang bisa diubah tanpa redeploy. Semua konfigurasi runtime harus disimpan di D1 dan dikelola melalui frontend CRUD admin/settings.

## Core Rule

Tidak boleh ada konfigurasi bisnis, provider, model, search strategy, scoring weight, timeout, retry, atau feature flag yang di-hardcode di source code.

Source code hanya boleh memiliki default aman untuk bootstrapping jika D1 belum memiliki data.

## Configuration Categories

| Category | Table | Editable From Frontend | Secret Allowed |
|---|---|---:|---:|
| App config | `sh_appConfigs` | Yes | No |
| AI provider config | `sh_aiProviderConfigs` | Yes | No, only `secretRef` |
| AI model config | `sh_aiModelConfigs` | Yes | No |
| Search provider config | `sh_searchProviderConfigs` | Yes | No, only `secretRef` |
| Scoring config | `sh_scoringConfigs` | Yes | No |

## Required Admin UI

Admin/settings frontend harus memiliki menu:

1. App Configs
2. AI Providers
3. AI Models
4. Search Providers
5. Scoring Configs
6. Test Console

## App Config Examples

| key | value | type | Notes |
|---|---|---|---|
| `maxCompareLinks` | `5` | number | Maksimal link Shopee untuk compare |
| `keywordSearchLimit` | `10` | number | Jumlah output top product |
| `defaultShippedFrom` | `DKI Jakarta` | string | Default shipped from |
| `jobPollIntervalMs` | `3000` | number | Polling interval frontend |
| `browserRunEnabled` | `true` | boolean | Enable Browser Run fallback |
| `vpsScraperEnabled` | `false` | boolean | Optional fallback VPS |

## AI Provider Config Examples

| providerKey | displayName | baseUrl | authType | secretRef | isEnabled |
|---|---|---|---|---|---:|
| `9router` | `9router` | `<from-admin-config>` | `bearer` | `NINEROUTER_API_KEY` | true |

## AI Model Config Examples

| providerKey | modelKey | displayName | usageType | isDefault | isEnabled |
|---|---|---|---|---:|---:|
| `9router` | `primary` | `Primary Model` | `reasoning` | true | true |
| `9router` | `extraction` | `Extraction Model` | `extraction` | true | true |
| `9router` | `fallback` | `Fallback Model` | `fallback` | false | true |

`modelName` harus bisa diubah dari frontend karena model yang tersedia di 9router dapat berubah. The `extraction` model is used by the Cloudflare Browser Rendering agentic loop (PRD §Runtime Configuration: "Frontend admin harus bisa … Mengubah model primary, fast, fallback").

## Test Console

Frontend harus menyediakan tombol test (PRD §Required Configuration UI):

- Test provider connection.
- Test model response.
- Test JSON output mode.
- Test timeout behavior.
- Test fallback model.

Test result disimpan ke D1 di kolom `lastTestStatus`, `lastTestAt`, `lastTestMessage`, plus `lastLatencyMs` (on AI model row).

## Runtime Config Loading

Urutan loading config:

1. Load active config dari D1.
2. Jika config tidak ada, gunakan safe bootstrap env default.
3. Jangan hardcode production value di source code.
4. Cache config per request/job dengan TTL pendek.
5. Admin update harus mengubah `updatedAt` agar cache bisa di-invalidate.

Environment variables are not the primary runtime configuration source. They are allowed only for secret values and safe bootstrap fallback while D1 is empty.

## Secret Handling

D1 hanya boleh menyimpan nama secret reference, contoh:

```txt
secretRef = NINEROUTER_API_KEY
```

D1 tidak boleh menyimpan nilai API key atau token.
