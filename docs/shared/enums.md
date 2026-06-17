# Shared Enums

This document is the canonical source for string enum values used by API responses, database rows, Zod schemas, UI state, and tests.

## User Role

- `user`
- `admin`

## User Status

- `active`
- `disabled`

## Research Mode

- `compareLinks`
- `keywordSearch`

## Job Status

- `pending`
- `processing`
- `completed`
- `failed`
- `partialSuccess`

Rules:

- Use `partialSuccess` everywhere in TypeScript, JSON, API responses, D1 rows, and UI.
- Do not use `partial success`, `partial_success`, `PARTIAL_SUCCESS`, or `partial_success`.

## Job Type

- `compareLinks`
- `keywordSearch`

## Job Step

- `queued`
- `resolvingUrl`
- `searchingCandidates`
- `fetchingProduct`
- `fetchingShop`
- `extractingWeight`
- `extractingFeatures`
- `scoring`
- `generatingReport`
- `savingResult`
- `completed`
- `failed`

## Error Code

- `INVALID_INPUT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `SHORT_URL_RESOLVE_FAILED`
- `PRODUCT_NOT_FOUND`
- `SHOP_NOT_FOUND`
- `WEIGHT_NOT_FOUND`
- `SHOPEE_FETCH_FAILED`
- `BROWSER_RENDER_FAILED`
- `AI_REPORT_FAILED`
- `PARTIAL_DATA_ONLY`
- `RATE_LIMITED`
- `QUEUE_FAILED`
- `CONFIG_NOT_FOUND`
- `CONFIG_TEST_FAILED`
- `INTERNAL_ERROR`

## Shop Status

- `MALL`
- `OFFICIAL`
- `STAR`
- `STARPLUS`
- `PREFERRED`
- `REGULAR`
- `UNKNOWN`

Rules:

- Use `STARPLUS`, not `STAR_PLUS`.
- `primaryStatus` must contain exactly one value from this enum.
- Additional labels may be stored in `statusJson`.

## Resolve Method

- `direct`
- `redirect`
- `webFetch`
- `browserRun`
- `manual`

## Resolve Status

- `resolved`
- `failed`

## Config Value Type

- `string`
- `number`
- `boolean`
- `json`

## Test Status

- `success`
- `failed`
- `untested`

## Search Provider Type

- `officialApi`
- `webFetch`
- `browserRun`
- `vpsScraper`
- `manual`

## Auth Type

- `bearer`
- `apiKey`
- `none`

## Risk Severity

- `LOW`
- `MEDIUM`
- `HIGH`

## Field Availability Status

- `available`
- `unavailable`
- `partial`
