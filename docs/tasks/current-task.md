# TASK-093: Build product parser

## Status

DONE

## Goal

Build a Shopee product parser that extracts ProductSnapshot fields from raw HTML/JSON content. Each field must include source and confidence, missing fields return null with confidence 0.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/parser/productParser.ts` — ProductParser class
- Parses raw HTML/JSON to extract ProductSnapshot fields
- Each field has source and confidence score
- Missing fields return null with confidence 0 (no fabrication)
- Support multiple input formats (HTML, JSON, JSON-LD)
- Add comprehensive unit tests

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/parser/productParser.ts` (new)
- `packages/shopee/src/parser/productParser.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

`parseProduct(input: { html?: string; json?: unknown; shopId: string; itemId: string; canonicalUrl: string }): ProductSnapshot`

## Output Contract

Returns complete ProductSnapshot with each field's source and confidence.

## Acceptance Criteria

- [ ] ProductParser class implemented
- [ ] Parses HTML, JSON, and JSON-LD formats
- [ ] Extracts: title, priceMin, priceMax, rating, reviewCount, soldCount, brand, category, description, stock
- [ ] Each field has source and confidence
- [ ] Missing fields return null with confidence 0
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for HTML parsing
- [ ] Unit test for JSON parsing
- [ ] Unit test for JSON-LD parsing
- [ ] Unit test for missing fields (null with confidence 0)
- [ ] Unit test for malformed input (safe handling)

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new parser

## Stop Conditions Check

- [ ] No hard stop condition is triggered

## Completion Rule

Task is complete only when:
- Lint passes
- Typecheck passes
- Tests pass
- Build passes
- Self-review passes
- Task is committed
