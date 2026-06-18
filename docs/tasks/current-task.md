# TASK-054: Create MockShopeeExtractor

## Status

DONE

## Goal

Create a mock Shopee extractor that returns fixture data for development/testing.

## Required Reading

- `docs/database/schema.md`
- `docs/shopee/extraction-strategy.md`
- `docs/shared/enums.md`
- `docs/tasks/autopilot-task-contract.md`

## Scope

- Implement mockExtractProduct using fixtures.
- Implement mockExtractShop using fixtures.
- Implement mockExtractByUrl combined helper.
- Add unit tests.

## Out of Scope

- Do not create real HTTP-based extractor (later).
- Do not create keyword search (later).

## Allowed Files

- `packages/shopee/src/extractors/mockExtractor.ts`
- `packages/shopee/src/extractors/mockExtractor.test.ts`
- `packages/shopee/src/index.ts`
- `docs/tasks/**`

## Input Contract

ExtractProductInput / ExtractShopInput from shared package.

## Output Contract

ProductSnapshot / ShopSnapshot from shared package.

## Acceptance Criteria

- [ ] mockExtractProduct implemented
- [ ] mockExtractShop implemented
- [ ] mockExtractByUrl implemented
- [ ] Unit tests pass
- [ ] Quality gate passes

## Completion Rule

Lint, typecheck, test, build, quality gate all pass.
