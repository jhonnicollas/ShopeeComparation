# Folder Structure

```txt
shopee-product-research-ai/
  apps/
    web/
      src/
        app/
        pages/
        components/
        features/
        lib/
      package.json

  workers/
    api/
      src/
      wrangler.toml

    queueConsumer/
      src/
      wrangler.toml

    mastra/
      src/
      wrangler.toml

  packages/
    shared/
      src/
        types/
        schemas/
        constants/
        utils/

    db/
      migrations/
      src/
        queries/
        repositories/

    core/
      src/
        scoring/
        comparison/
        normalization/
        risk/

    shopee/
      src/
        resolver/
        extractor/
        parser/
        adapters/
        fixtures/

    ai/
      src/
        mastra/
        agents/
        workflows/
        prompts/
        9router/

  docs/
  .ai/
```

## Rules

- `apps/web` cannot import from `workers`.
- `apps/web` can import `packages/shared` only.
- `workers/api` can import `packages/shared`, `packages/db`, `packages/core`, `packages/shopee`, and `packages/ai`.
- Shopee-specific logic must not exist outside `packages/shopee`.
- AI prompt logic must not exist outside `packages/ai`.
- Scoring logic must not exist outside `packages/core`.
