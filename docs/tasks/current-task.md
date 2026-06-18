# TASK-094: Build shop parser

## Status

DONE

## Goal

Build a Shopee shop parser that extracts ShopSnapshot fields from raw HTML/JSON content. Each field must include source and confidence, missing fields return null with confidence 0. Shop status is normalized to canonical enum values (MALL, OFFICIAL, STAR, STARPLUS, PREFERRED, REGULAR, UNKNOWN).

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/shopee/extraction-strategy.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/parser/shopParser.ts` — ShopParser class
- Parses raw HTML/JSON to extract ShopSnapshot fields
- Each field has source and confidence score
- Missing fields return null with confidence 0 (no fabrication)
- Shop status normalized to canonical enum
- Support multiple input formats (HTML, JSON, JSON-LD)
- Add comprehensive unit tests

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/parser/shopParser.ts` (new)
- `packages/shopee/src/parser/shopParser.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

`parseShop(input: { html?: string; json?: unknown; shopId: string }): ShopSnapshot`

## Output Contract

Returns complete ShopSnapshot with each field's source and confidence.

## Acceptance Criteria

- [ ] ShopParser class implemented
- [ ] Parses HTML, JSON, and JSON-LD formats
- [ ] Extracts: name, rating, responseRate, responseTime, followerCount, productCount, joinedAgeText, location
- [ ] Normalizes shop status to MALL/OFFICIAL/STAR/STARPLUS/PREFERRED/REGULAR/UNKNOWN
- [ ] Each field has source and confidence
- [ ] Missing fields return null with confidence 0
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for HTML parsing
- [ ] Unit test for JSON parsing
- [ ] Unit test for JSON-LD parsing
- [ ] Unit test for shop status normalization
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
