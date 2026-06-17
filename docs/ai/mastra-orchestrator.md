# Mastra Orchestrator

## Role

Mastra adalah workflow orchestrator. Mastra tidak menggantikan scoring engine dan tidak menjadi database utama.

Mastra bertugas mengatur:

- Intent classification.
- URL resolver workflow.
- Product extraction workflow.
- Shop extraction workflow.
- Weight extraction workflow.
- Data quality check.
- Risk analysis.
- AI report generation.

## Compare Links Workflow

Input:

```json
{
  "userId": "usr_xxx",
  "researchSessionId": "rsr_xxx",
  "links": ["https://id.shp.ee/kf239Muk"],
  "mode": "compareLinks"
}
```

Steps:

1. Validate input.
2. Resolve URLs.
3. Extract `shopId` and `itemId`.
4. Fetch product data.
5. Fetch shop data.
6. Extract product weight.
7. Normalize product and shop data.
8. Run data quality check.
9. Run scoring engine.
10. Run comparison engine.
11. Generate AI recommendation report through 9router.
12. Save result to D1 and R2.
13. Update job status.

## Keyword Search Workflow

Input:

```json
{
  "userId": "usr_xxx",
  "researchSessionId": "rsr_xxx",
  "keyword": "tensimeter digital",
  "shippedFrom": "DKI Jakarta",
  "limit": 10,
  "mode": "keywordSearch"
}
```

Steps:

1. Validate input.
2. Build search query.
3. Fetch search candidates.
4. Filter or prioritize DKI Jakarta.
5. Deduplicate products.
6. Select candidate products.
7. Enrich product details.
8. Enrich shop details.
9. Extract weights.
10. Normalize data.
11. Score all candidates.
12. Rank top 10.
13. Generate AI report.
14. Save result.
15. Update job status.

## Agents

| Agent | Responsibility |
|---|---|
| IntentClassifierAgent | Classify request as compareLinks or keywordSearch |
| UrlResolverAgent | Resolve short/full Shopee URL |
| ProductSearchAgent | Collect product candidates from keyword |
| ProductExtractorAgent | Extract product data |
| ShopIntelligenceAgent | Extract and normalize shop data |
| WeightExtractorAgent | Extract product weight |
| FeatureExtractorAgent | Extract product features |
| RiskAnalyzerAgent | Detect red flags |
| ScoringAgent | Call deterministic scoring engine |
| ComparisonAgent | Rank products and determine best product |
| RecommendationWriterAgent | Generate final report |
| DataQualityAgent | Detect missing or low-confidence data |

## AI Safety Rules

- AI only reads structured data.
- AI must not invent missing values.
- AI report must mention unavailable fields.
- AI output must be validated with Zod.
- Scoring number must come from deterministic scoring engine.
