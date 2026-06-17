# Data Flow

## Compare Links Data Flow

```txt
Input links
→ Zod validation
→ research session row
→ job row
→ queue message
→ URL resolver
→ product extractor
→ shop extractor
→ weight extractor
→ normalizer
→ scoring engine
→ risk analyzer
→ Mastra report workflow
→ D1 structured result
→ R2 raw artifacts
→ result page
```

## Keyword Search Data Flow

```txt
Input keyword
→ Zod validation
→ research session row
→ job row
→ queue message
→ query planner
→ search adapter
→ candidate collector
→ DKI Jakarta filter
→ product enrichment
→ shop enrichment
→ weight extraction
→ scoring
→ top 10 ranking
→ AI report
→ result page
```

## Data Quality Flow

Every extracted field must be represented as:

```ts
{
  value: unknown | null;
  source: string | null;
  confidence: number;
  status: "available" | "unavailable" | "partial";
}
```

Missing data must not be inferred as fact.
