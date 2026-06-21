# Configuration CRUD UI

## Purpose

Admin must be able to manage runtime configuration from frontend without editing source code or redeploying (PRD §Required Configuration UI).

## Actual Route

```
/settings/config
```

Implemented as a single tabbed page (`apps/web/src/pages/ConfigPage.tsx`) with 5 entity tabs.

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

## Implementation

Single page at `/settings/config` (`apps/web/src/pages/ConfigPage.tsx`) with 5 tabs (one per entity type). Each tab uses the same `useQuery` + mutation pattern against `/api/admin/configs/{entity}`.

The page is admin-only. Non-admin users get the "Access denied" empty state.

The CRUD UI is wired to:
- `apps/web/src/pages/ConfigPage.tsx` (page component)
- `apps/web/src/components/` (form controls, error handling)
- `apps/web/src/lib/api.ts` (apiRequest helper with cookie auth)
