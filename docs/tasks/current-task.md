# TASK-096: Build feature extractor

## Status

DONE

## Goal

Build a Shopee product feature extractor that extracts ProductFeatureItem[] from raw HTML/JSON/text. Each feature has name, value, source, and confidence. Missing features return empty array (no fabrication).

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/parser/featureExtractor.ts` — FeatureExtractor class
- Extracts product features from specifications, description, and metadata
- Returns ProductFeatureItem[] with name, value, source, confidence
- Supports multiple input formats (HTML tables, JSON specs, text patterns)
- Add comprehensive unit tests

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/parser/featureExtractor.ts` (new)
- `packages/shopee/src/parser/featureExtractor.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

`extractFeatures(input: { html?: string; json?: unknown; text?: string }): ProductFeatureItem[]`

## Output Contract

ProductFeatureItem[] with name, value, source, confidence.

## Acceptance Criteria

- [ ] FeatureExtractor class implemented
- [ ] Extracts from HTML specifications
- [ ] Extracts from JSON specs
- [ ] Extracts from text patterns
- [ ] Each feature has source and confidence
- [ ] Returns empty array when no features found
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for HTML table extraction
- [ ] Unit test for JSON specs extraction
- [ ] Unit test for text pattern extraction
- [ ] Unit test for empty input
- [ ] Unit test for source attribution

## Documentation Update

- [ ] Update `packages/shopee/src/index.ts` to export new extractor

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
