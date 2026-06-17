# 9router Configuration

## Decision

9router is the AI gateway. All AI model calls must go through the backend or Mastra workflow, never from frontend.

## Environment Variables

| Name | Required | Description |
|---|---|---|
| NINEROUTER_BASE_URL | yes | Base URL of 9router server |
| NINEROUTER_API_KEY | yes | API key for 9router |
| NINEROUTER_MODEL_PRIMARY | yes | Primary model for final report |
| NINEROUTER_MODEL_FAST | yes | Fast model for small extraction/classification |
| NINEROUTER_MODEL_FALLBACK | yes | Fallback model if primary fails |
| NINEROUTER_TIMEOUT_MS | yes | Request timeout |
| NINEROUTER_MAX_RETRIES | yes | Retry count |

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
