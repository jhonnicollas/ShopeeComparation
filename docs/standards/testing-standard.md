# Testing Standard

## Required Test Types

- Unit test for core scoring.
- Unit test for URL parser.
- Unit test for Zod schemas.
- Unit test for weight extraction.
- Integration test for compare links mock flow.
- Integration test for keyword search mock flow.
- Manual test for Cloudflare Queue job.

## Test Fixtures

Use fixture data before real Shopee extraction.

Fixtures live in:

```txt
packages/shopee/src/fixtures
```

## Quality Gate

Before merge:

```txt
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For Cloudflare:

```txt
wrangler deploy --dry-run
```
