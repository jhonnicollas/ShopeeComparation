# 9router Configuration

## Decision

9router is the AI gateway. All AI model calls must go through the backend or Mastra workflow, never from frontend.

## Runtime Configuration Source

9router runtime configuration is D1-first.

Load order:

1. Active provider/model rows from `sh_aiProviderConfigs` and `sh_aiModelConfigs`.
2. Safe bootstrap environment defaults if D1 is empty.
3. Built-in development fallback only for non-secret local bootstrap.

D1 stores `secretRef`, not the actual API key. The Worker reads the secret value from `env[secretRef]`.

## Environment Variables

| Name | Required | Description |
|---|---|---|
| NINEROUTER_BASE_URL | yes | Bootstrap fallback base URL if D1 config is empty |
| NINEROUTER_API_KEY | yes | API key for 9router |
| NINEROUTER_MODEL_PRIMARY | yes | Bootstrap fallback primary model if D1 config is empty |
| NINEROUTER_MODEL_FAST | yes | Bootstrap fallback fast model if D1 config is empty |
| NINEROUTER_MODEL_FALLBACK | yes | Bootstrap fallback model if D1 config is empty |
| NINEROUTER_TIMEOUT_MS | yes | Bootstrap fallback request timeout |
| NINEROUTER_MAX_RETRIES | yes | Bootstrap fallback retry count |

## Use Cases

- Recommendation report.
- Feature extraction from product description.
- Risk explanation.
- Data quality explanation.
- Query planning.

## Rules

- API key must never be exposed to frontend.
- Request and response metadata may be logged.
- Raw long response must be stored in R2, not D1.
- Output must be validated with Zod.
- Prompt version must be stored in `sh_aiReports.promptVersion`.

## Provider and Model Configuration Must Be Editable From Frontend

9router provider and model configuration must be stored in D1 and managed via admin/settings UI.

Required tables:

- `sh_aiProviderConfigs`
- `sh_aiModelConfigs`

Required frontend actions:

1. Create provider config.
2. Update provider base URL.
3. Enable/disable provider.
4. Create model config.
5. Set primary model.
6. Set fast model.
7. Set fallback model.
8. Test selected model.
9. View last test response metadata.

## Required Model Test Payload

```json
{
  "providerKey": "9router",
  "modelKey": "primary",
  "prompt": "Return JSON only: {\"ok\": true, \"message\": \"test\"}"
}
```

## Required Model Test Result

```json
{
  "status": "success",
  "providerKey": "9router",
  "modelKey": "primary",
  "latencyMs": 1200,
  "outputValidJson": true,
  "message": "Model test succeeded"
}
```

## Secret Rule

D1 stores:

```txt
secretRef = NINEROUTER_API_KEY
```

D1 must not store the actual API key.
# AI Agent Roles

## Product Agent

Responsible for PRD, user stories, acceptance criteria, and scope control.

## Architect Agent

Responsible for architecture, technical decisions, folder structure, and ADR.

## Backend Agent

Responsible for Cloudflare Workers API, D1 repositories, R2 helpers, and Queue integration.

## Frontend Agent

Responsible for React + Vite UI, routes, forms, tables, result pages, and polling.

## Shopee Extractor Agent

Responsible for URL resolver, search collector, product extractor, shop extractor, and parser fixtures.

## Mastra Agent

Responsible for Mastra workflows, agent definitions, prompts, 9router integration, and AI output validation.

## Core Logic Agent

Responsible for scoring engine, comparison engine, risk rules, and normalization.

## QA Agent

Responsible for tests, fixtures, edge cases, and verification.

## Reviewer Agent

Responsible for reviewing implementation against docs and task scope.

## DevOps Agent

Responsible for wrangler config, deployment, environment variables, and CI checks.
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
# Prompt Contract

Semua prompt AI wajib mengikuti kontrak ini agar output stabil, tidak mengarang, dan mudah divalidasi.

## Global AI Rules

1. AI hanya boleh memakai data yang diberikan dalam input.
2. AI tidak boleh browsing sendiri.
3. AI tidak boleh mengarang data produk, harga, berat, rating, atau reputasi toko.
4. Jika data tidak tersedia, sebutkan bahwa data tidak tersedia.
5. AI tidak boleh mengubah score numeric yang sudah dihitung scoring engine.
6. Output harus valid JSON jika diminta.
7. Prompt harus memiliki version.

## Recommendation Report Input

```json
{
  "comparisonId": "cmp_123",
  "products": [],
  "shops": [],
  "scores": [],
  "risks": [],
  "missingDataNotes": []
}
```

## Recommendation Report Output

```json
{
  "bestProductId": "prd_123",
  "bestValueProductId": "prd_456",
  "safestProductId": "prd_789",
  "summary": "string",
  "reasons": ["string"],
  "rankings": [
    {
      "productId": "prd_123",
      "rank": 1,
      "reason": "string"
    }
  ],
  "warnings": ["string"],
  "missingDataNotes": ["string"],
  "confidence": 0.85
}
```

## Feature Extraction Output

```json
{
  "features": [
    {
      "name": "string",
      "value": "string",
      "source": "TITLE | DESCRIPTION | SPECIFICATION | AI_EXTRACTED",
      "confidence": 0.8
    }
  ]
}
```

## Risk Analysis Output

```json
{
  "risks": [
    {
      "type": "LOW_REVIEW_COUNT",
      "severity": "LOW | MEDIUM | HIGH",
      "message": "string",
      "impact": 8
    }
  ]
}
```

## Forbidden Output

AI tidak boleh menjawab:

```txt
Produk ini pasti original jika tidak ada data original.
Berat produk 500 gram jika tidak ada data berat.
Rating toko bagus jika rating toko tidak tersedia.
```

## Prompt Versioning

Setiap prompt harus memiliki:

- promptName
- promptVersion
- expectedOutputSchema
- model
- provider
