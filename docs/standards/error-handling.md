# Error Handling Standard

## Error Codes

| Code | Meaning |
|---|---|
| INVALID_INPUT | Request validation failed |
| UNAUTHORIZED | User not logged in |
| FORBIDDEN | User cannot access resource |
| SHORT_URL_RESOLVE_FAILED | Short URL resolver failed |
| PRODUCT_NOT_FOUND | Product data unavailable |
| SHOP_NOT_FOUND | Shop data unavailable |
| WEIGHT_NOT_FOUND | Weight unavailable |
| SHOPEE_FETCH_FAILED | Shopee fetch failed |
| BROWSER_RENDER_FAILED | Browser Run failed |
| AI_REPORT_FAILED | AI report failed |
| PARTIAL_DATA_ONLY | Partial result only |
| RATE_LIMITED | User or service rate limited |
| QUEUE_FAILED | Queue enqueue or consume failed |

## Rules

- User-facing error must be clear and non-technical.
- Internal stacktrace must not be sent to frontend.
- Every failed job must create `sh_jobLogs` row.
- Partial success must still show available data.
