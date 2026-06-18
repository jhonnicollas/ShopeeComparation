# TASK-095: Build product weight extractor

## Status

DONE

## Goal

Build a Shopee product weight extractor that extracts WeightExtraction from raw text/HTML/JSON. Supports multiple weight units (gram, kg, mg, lb, oz), sources from specifications, description, metadata, variants, and shipping info. Each extraction has source and confidence.

## Required Reading

- `docs/prd/prd.md`
- `docs/architecture/technical-decisions.md`
- `docs/shared/enums.md`
- `docs/database/schema.md`
- `docs/tasks/autopilot-task-contract.md`
- `.ai/agent-rules.md`

## Scope

- Create `packages/shopee/src/parser/weightExtractor.ts` — WeightExtractor class
- Extracts weight from text with multiple patterns
- Supports units: gram, kg, mg, lb, oz
- Source attribution (productSpecification, description, metadata, variant, shipping, aiExtraction)
- Returns WeightExtraction type with value, unit, rawText, source, confidence
- Add comprehensive unit tests

## Out of Scope

- Do not create API endpoints
- Do not create frontend UI
- Do not change D1 schema

## Allowed Files

- `packages/shopee/src/parser/weightExtractor.ts` (new)
- `packages/shopee/src/parser/weightExtractor.test.ts` (new)
- `packages/shopee/src/index.ts` (re-export)
- `docs/tasks/**`

## Forbidden Files

- `apps/**`
- `workers/**`
- `packages/db/**`
- `packages/core/**`
- `packages/ai/**`

## Input Contract

`extractWeight(input: { text: string; sourceContext?: string }): WeightExtraction`

## Output Contract

WeightExtraction { value, unit, rawText, source, confidence }

## Acceptance Criteria

- [ ] WeightExtractor class implemented
- [ ] Supports gram, kg, mg, lb, oz units
- [ ] Multiple patterns: "500g", "1.5 kg", "Berat: 500g", etc.
- [ ] Source attribution: productSpecification, description, metadata, variant, shipping, aiExtraction
- [ ] Returns WeightExtraction with all fields populated when found
- [ ] Returns empty WeightExtraction with confidence 0 when not found
- [ ] Unit tests pass
- [ ] All existing tests still pass
- [ ] Quality gate passes

## Test Requirements

- [ ] Unit test for gram extraction
- [ ] Unit test for kg extraction
- [ ] Unit test for mg extraction
- [ ] Unit test for lb/oz extraction
- [ ] Unit test for source attribution
- [ ] Unit test for no weight found
- [ ] Unit test for multiple matches (best confidence wins)

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
