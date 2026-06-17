# Configuration CRUD UI

## Purpose

Admin must be able to manage runtime configuration from frontend without editing source code or redeploying.

## Required Routes

```txt
/settings/configs/app
/settings/configs/ai-providers
/settings/configs/ai-models
/settings/configs/search-providers
/settings/configs/scoring
/settings/configs/test-console
```

## Access Control

Only admin users can access configuration CRUD.

## App Config Page

Fields:

- key
- value
- valueType
- category
- description
- isPublic
- isEnabled

## AI Provider Page

Fields:

- providerKey
- displayName
- baseUrl
- authType
- secretRef
- timeoutMs
- retryCount
- isEnabled
- lastTestStatus
- lastTestAt
- lastTestMessage

Actions:

- Create
- Update
- Disable
- Test Provider

## AI Model Page

Fields:

- providerKey
- modelKey
- modelName
- displayName
- usageType
- contextWindow
- supportsJson
- supportsTools
- supportsVision
- costInput
- costOutput
- isDefault
- isEnabled
- lastTestStatus
- lastTestAt
- lastTestMessage

Actions:

- Create
- Update
- Disable
- Set as primary
- Set as fast
- Set as fallback
- Test Model

## Search Provider Page

Fields:

- providerKey
- displayName
- providerType
- priority
- baseUrl
- authType
- secretRef
- timeoutMs
- retryCount
- isEnabled
- lastTestStatus
- lastTestAt
- lastTestMessage

Actions:

- Create
- Update
- Disable
- Change priority
- Test Provider

## Scoring Config Page

Fields:

- configKey
- displayName
- category
- weightsJson
- isDefault
- isEnabled

Actions:

- Create
- Update
- Disable
- Set as default
- Preview score using sample data

## Security Rule

Frontend must never display actual secret values. It may display only `secretRef` names.
