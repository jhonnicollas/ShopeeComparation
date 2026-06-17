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
