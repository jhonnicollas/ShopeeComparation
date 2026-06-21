# 9router and AI Orchestration

## 9router as AI Gateway

9router is the AI gateway. All AI model calls go through the queue consumer (not a separate Worker). The frontend never calls 9router directly.

### 9router Runtime Configuration

**D1-first load order:**

1. Active rows from `sh_aiProviderConfigs` and `sh_aiModelConfigs`.
2. Safe bootstrap environment defaults if D1 is empty.
3. Built-in development fallback only for non-secret local bootstrap.

D1 stores only `secretRef` (e.g. `NINEROUTER_API_KEY`), not the actual key. The Worker reads the secret via `env[secretRef]`.

### Bootstrap Environment Variables

| Name | Required | Description |
|---|---|---|
| `NINEROUTER_API_KEY` | yes (when D1 has no provider) | API key for 9router |
| `NINEROUTER_BASE_URL` | bootstrap | Fallback base URL if D1 is empty |
| `NINEROUTER_MODEL_*` | bootstrap | Fallback model identifiers |
| `NINEROUTER_TIMEOUT_MS` | bootstrap | Fallback request timeout |
| `BROWSER_RUN_BASE_URL` | yes (when browserRun provider used) | Browser Run adapter base URL |
| `BROWSER_RUN_API_KEY` | yes (when browserRun provider used) | Browser Run API key |
| `CLOUDFLARE_ACCOUNT_ID` | yes (when CloudflareBrowserRendering used) | Cloudflare account for Browser Run REST API |
| `CLOUDFLARE_API_TOKEN` | yes (when CloudflareBrowserRendering used) | Cloudflare API token with `Browser Rendering - Edit` permission |

### Provider/Model Config CRUD

`sh_aiProviderConfigs` and `sh_aiModelConfigs` are managed via `/api/admin/configs/ai-providers` and `/api/admin/configs/ai-models`. Models declare `usageType` (PRD §Runtime Config: `reasoning | extraction | fallback | vision | test`). The job processor reads the default model for `usageType=extraction` to pick the model used by the Cloudflare Browser Rendering agentic loop.

### 9router Use Cases in MVP

- Recommendation report (Mastra workflow → RecommendationWriter agent).
- Risk explanation (Mastra workflow → RiskAnalyzer agent).
- Data quality summary (Mastra workflow → DataQualityAgent agent).
- Test mode (`/api/admin/configs/ai-models/:id/test`).

### Rules

- API key never exposed to frontend.
- Long raw response must be stored in R2 (`sh_aiReports.rawResponseR2Key`), not D1.
- AI output must be Zod-validated before persistence.
- Prompt version stored in `sh_aiReports.promptVersion`.
- All model names must come from D1 config (no hardcoded model strings in source). Enforced by `apps/web/src/__tests__/prd-resources.test.ts`.

# Mastra Orchestrator

## Role

Mastra is the **workflow orchestrator only**. It does not replace the deterministic scoring engine and is not the source of truth for data.

Mastra runs the **AI recommendation workflow** that produces the final report. Scoring, risk analysis, and data quality are still driven by deterministic engines in `packages/core` and AI agents in `packages/ai/src/agents/`. The workflow is invoked from the queue consumer (`packages/ai/src/jobProcessor.ts`).

## Three Actual AI Agents

`packages/ai/src/agents/` contains exactly three agent modules:

| Agent | File | Responsibility |
|---|---|---|
| `recommendationWriter` | `recommendationWriter.ts` | Generate `bestProductId`, `ranking[]`, `prosCons[]`, `redFlags[]`, `missingDataNotes[]` from structured products+shops+scores+risks input |
| `riskAnalyzer` | `riskAnalyzer.ts` | Produce human-readable risk narrative per product (severity grouping, ordering) |
| `dataQualityAgent` | `dataQualityAgent.ts` | Summarize which fields were missing/low-confidence across the comparison |

The Mastra workflow `researchWorkflow` (`packages/ai/src/mastra/researchWorkflow.ts`) runs these three agents in sequence as steps.

## Compare Links Workflow (Actual Code Path)

Entry point: `packages/ai/src/jobProcessor.ts` → `processJobSync(env, message, jobId)`.

```txt
1. Load search config (D1 sh_searchProviderConfigs + env CLOUDFLARE_* or NINEROUTER_* or BROWSER_RUN_*).
2. Resolve each input URL via resolveUrl (id.shp.ee → canonical shopee URL).
3. extractProduct for each URL via active adapter.
4. extractShop for each unique shopId.
5. calculateProductScore + detectRisks (deterministic, in packages/core).
6. rankProducts.
7. upsertProduct + upsertShop + saveProductWeight + saveProductFeatures + saveRawProductSnapshot to R2.
8. runResearchWorkflow (Mastra):
   a. recommendationWriter → best product + reasons
   b. riskAnalyzer → risk narratives
   c. dataQualityAgent → missing data notes
9. Save sh_aiReports row with Zod-validated report JSON + R2 raw response.
10. Build sh_comparisons + sh_comparisonItems (rank 1..N).
11. Update sh_jobs.status to completed | partialSuccess | failed.
12. Frontend polls /api/research/jobs/:id → /result/:sessionId.
```

## Keyword Search Workflow (Actual Code Path)

```txt
1. Load search config (same as above).
2. extractSearchCandidates (limit * 3 buffer for filtering):
   - For each candidate returned by adapter.searchProducts:
     - extractProduct → save to D1
     - extractShop → save to D1
3. Filter via shippedFromFilter (DKI Jakarta priority).
4. Dedupe by shopId:itemId.
5. Enrich candidates (already done in step 2).
6. Rank via topTenRanking.
7. Same scoring + risk + AI workflow as Compare Links.
```

## Agentic Loop for `web_fetch` Tool

9router returns `tool_calls` for `web_fetch` without executing. The `NineRouterFetchAdapter.webFetch()` implements an **agentic loop** (max 3 turns):

```txt
Turn 1: POST { model, messages, tools: [web_fetch] }
  → 9router returns tool_calls
Turn 2: If tool_call has { content: "..." } directly in arguments, return it (model gave content inline)
        Else: execute web_fetch ourselves (fetch the URL with browser UA), send tool result back
Turn 3: 9router returns final answer (text) → return
```

If `content` is in tool_call arguments (some models return it inline), we return that without executing. Otherwise we execute the fetch ourselves to honor the model intent.

## Prompt Contract

All AI prompts follow this contract to keep output stable, non-fabricating, and Zod-validatable.

### Global AI Rules

1. AI only uses data given in input. Never browses.
2. AI never fabricates product, price, weight, rating, shop reputation.
3. Missing data → AI mentions "tidak tersedia" / "data not available" / "missingDataNotes".
4. AI never overrides deterministic scoring numbers.
5. Output must be valid JSON if requested.
6. Every prompt has a version (stored in `sh_aiReports.promptVersion`).

### Recommendation Report Input Schema

```json
{
  "comparisonId": "cmp_xxx",
  "products": [...ProductSnapshot],
  "shops": [...ShopSnapshot],
  "scores": [...ComparisonItem],
  "risks": [...RiskItem],
  "missingDataNotes": ["product weight not found"]
}
```

### Recommendation Report Output Schema (Zod-validated)

```json
{
  "bestProductId": "prd_xxx",
  "bestProductName": "...",
  "ranking": [{ "productId": "prd_xxx", "rank": 1, "reason": "..." }],
  "valueForMoneyProductId": "prd_xxx",
  "safestProductId": "prd_xxx",
  "riskiestProductId": "prd_yyy",
  "prosCons": [{ "productId": "prd_xxx", "pros": ["..."], "cons": ["..."] }],
  "redFlags": [],
  "confidence": 0.85,
  "missingDataNotes": []
}
```

### Risk Analysis Output Schema

```json
{
  "risks": [
    { "productId": "prd_xxx", "type": "LOW_REVIEW_COUNT", "severity": "LOW | MEDIUM | HIGH", "message": "...", "impact": 8 }
  ]
}
```

### Data Quality Output Schema

```json
{
  "issues": [
    { "field": "weight", "scope": "prd_xxx", "reason": "not found in specification" }
  ],
  "summary": "2 of 5 products missing weight"
}
```

### Forbidden Output (PRD §8.10)

AI must never answer:

- "Produk ini pasti original" if there is no original-data field
- "Berat produk 500 gram" if no weight data is present
- "Rating toko bagus" if shop rating is not available

### Prompt Versioning

Every prompt has: `promptName`, `promptVersion`, `expectedOutputSchema`, `model`, `provider`.

## AI Safety in Production

- Per PRD §Compliance: AI does not login to Shopee user, does not access cart/checkout/order/me, does not bypass CAPTCHA.
- Per PRD §9 Out of Scope: AI is only used for natural-language explanation, not for data acquisition.
- AI never invents missing values. The `confidence` field in AI output reflects data availability, not AI certainty.
