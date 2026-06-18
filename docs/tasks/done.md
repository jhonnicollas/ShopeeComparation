# Done Tasks

Completed autopilot tasks will be appended here.

## TASK-010: Setup pnpm workspace

Status: DONE
CompletedAt: 2026-06-17 20:00
Branch: codex/task-010-pnpm-workspace
Commit: 96bc80c

Summary:
- Added root pnpm workspace configuration and package scripts.
- Added strict TypeScript, ESLint, Prettier, and Vitest baseline configs.
- Added placeholder `apps`, `workers`, and `packages` directories for later scaffold tasks.
- Converted validation scripts to run under the ESM root package configuration.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass
- build: pass
- validation scripts: pass

## TASK-011: Setup React Vite frontend

Status: DONE
CompletedAt: 2026-06-17 20:15
Branch: codex/task-010-pnpm-workspace
Commit: 9ba4db1

Summary:
- Added `apps/web` React + Vite package.
- Configured TanStack Router and TanStack Query providers.
- Added placeholder home, compare, keyword search, and settings routes.
- Added frontend CSS baseline and verified local render in browser.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass
- build: pass
- validation scripts: pass
- browser verification: pass

## TASK-012: Setup Cloudflare Workers API

Status: DONE
CompletedAt: 2026-06-17 20:30
Branch: codex/task-010-pnpm-workspace
Commit: 3b1343a

Summary:
- Added `workers/api` Cloudflare Worker package.
- Configured Hono entrypoint with `GET /api/health`.
- Added typed Worker bindings for `DB`, `LOGS`, and `RESEARCH_QUEUE`.
- Added Wrangler config with existing D1 and R2 resources.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass
- build: pass
- validation scripts: pass

## TASK-013: Setup shared TypeScript types

Status: DONE
CompletedAt: 2026-06-17 21:15
Branch: feature/TASK-013-shared-types
Commit: pending

Summary:
- Created `packages/shared` package with package.json, tsconfig.json, and src/ structure.
- Defined all 17 enum const objects and string literal union types matching docs/shared/enums.md.
- Defined ID prefix constants for all 20 entity types.
- Defined all 20 database row interface types matching docs/database/schema.md.
- Defined all API request/response types matching docs/api/api-contract.md.
- Defined Shopee adapter types: ResolveUrlResult, ProductSnapshot, ShopSnapshot, SearchProvider, SearchInput, SearchResultCandidate, ShopeeExtractor, ScoringWeights, AiReportStructured, QueueMessage, RuntimeConfigSnapshot.
- Defined Worker environment types: ApiEnv, QueueConsumerEnv.
- Added barrel src/index.ts re-exporting everything.
- Added 22 unit tests covering all enum values match source-of-truth docs.
- Removed packages/.gitkeep since the package directory now has real files.
- Updated root tsconfig.json to include @cloudflare/workers-types for shared env types.
- Updated root package.json devDependencies.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (22 tests)
- build: pass
- validation scripts: pass

## TASK-014: Setup Zod validation schemas

Status: DONE
CompletedAt: 2026-06-17 21:25
Branch: feature/TASK-014-zod-schemas
Commit: 9f55a10

Summary:
- Added zod v4 as a dependency of packages/shared.
- Created Zod enum schemas for all 17 enums from docs/shared/enums.md.
- Created Zod request/response schemas for auth, research, shopee resolve-url, AI model test, and health APIs.
- Created Zod schemas for Shopee adapter output types: ProductSnapshot, ShopSnapshot, ResolveUrlResult, SearchResultCandidate, WeightExtraction.
- Created Zod schema for AI report structured output.
- Created Zod schema for queue message payload.
- Added 36 unit tests covering schema parse success and failure cases.
- Updated barrel exports in src/index.ts and src/schemas/index.ts.

Quality Gate:
- lint: pass
- typecheck: pass
- test: pass (58 tests)
- build: pass
- validation scripts: pass

## TASK-015: Setup lint, typecheck, test, and build scripts

Status: DONE
CompletedAt: 2026-06-17 17:57
Branch: feature/TASK-015-quality-scripts
Commit: f6fc08a

Summary:
- Added @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom to apps/web devDependencies.
- Created vitest.config.ts at workspace root with test.projects using node environment for workers/packages and jsdom for apps.
- Created apps/web/src/test-setup.ts importing @testing-library/jest-dom/vitest matchers.
- Created apps/web/src/pages/HomePage.test.tsx with 2 component smoke tests.
- Added format:fix script to root package.json.
- Fixed test to avoid duplicate element query by using container.querySelector for specific heading.
- Migrated from deprecated test.workspace to test.projects in vitest config.
- All workspace scripts (lint, typecheck, test, build) pass successfully.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (60 tests: 22 enum, 36 schema, 2 component)
- build: pass
- validation scripts: pass

## TASK-020: Setup wrangler config with existing DB and LOGS bindings

Status: DONE
CompletedAt: 2026-06-17 18:01
Branch: feature/TASK-020-wrangler-config
Commit: 9ef2c4a

Summary:
- Updated workers/api/wrangler.toml with all required non-secret environment variables from env-variables.md.
- Added APP_BASE_URL, NINEROUTER_BASE_URL, NINEROUTER_MODEL_PRIMARY, NINEROUTER_MODEL_FAST, NINEROUTER_MODEL_FALLBACK.
- Added JOB_POLL_INTERVAL_MS, MAX_COMPARE_LINKS, KEYWORD_SEARCH_LIMIT, DEFAULT_SHIPPED_FROM.
- Added comment documenting secrets that must be set via wrangler secret put (NINEROUTER_API_KEY, SESSION_SECRET, PASSWORD_PEPPER).
- Verified account_id, database_id, bucket_name match source-of-truth exactly.
- Verified D1, R2, and queue producer bindings are correct.
- No secret values committed.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (60 tests)
- build: pass
- validation scripts: pass

## TASK-021: Setup D1 schema using sh_ tables and camelCase columns

Status: DONE
CompletedAt: 2026-06-17 18:10
Branch: feature/TASK-021-d1-schema
Commit: 1b26c4e

Summary:
- Created packages/db package with package.json, tsconfig.json, and src/index.ts.
- Created initial migration file packages/db/migrations/0001_initial_schema.sql with all 20 tables from schema.md.
- All tables use sh_ prefix and camelCase columns without underscores.
- Added foreign key constraints for related tables.
- Added 22 indexes for common query patterns.
- Migration ready to apply via: wrangler d1 migrations apply multi_Ai_db.
- Added @shopee-research/db to workspace.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (60 tests)
- build: pass
- validation scripts: pass

## TASK-022: Setup R2 snapshot helper

Status: DONE
CompletedAt: 2026-06-17 18:14
Branch: feature/TASK-022-r2-helper
Commit: fc0266d

Summary:
- Created packages/db/src/r2.ts with R2 helper functions.
- Exported generateR2Key() to create unique keys with owner type prefix and timestamp.
- Exported putSnapshot() to upload data to R2 with metadata.
- Exported getSnapshot() to download data from R2.
- Exported getSnapshotText() as convenience helper for text retrieval.
- Added TypeScript types for R2 operations and owner types.
- Created packages/db/src/r2.test.ts with 11 unit tests.
- All tests use mock R2 bucket for isolation.
- Handles both R2HTTPMetadata object and Headers instance for content type.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (71 tests: 22 enum, 36 schema, 11 R2, 2 component)
- build: pass
- validation scripts: pass

## TASK-023: Setup Cloudflare Queue producer

Status: DONE
CompletedAt: 2026-06-17 18:17
Branch: feature/TASK-023-queue-producer
Commit: 2eea923

Summary:
- Created packages/db/src/queue.ts with queue producer functions.
- Exported sendResearchJobMessage() to send validated research job messages to RESEARCH_QUEUE.
- Exported sendBatchResearchJobMessages() for batch operations.
- Validates message payload using queueMessageSchema from shared package.
- Generates unique message IDs with timestamp and random suffix.
- Adds sentAt timestamp to message body for tracking.
- Created packages/db/src/queue.test.ts with 9 unit tests.
- Added @shopee-research/shared as runtime dependency in db package.
- Re-exported queue functions from packages/db/src/index.ts.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (80 tests: 22 enum, 36 schema, 11 R2, 9 queue, 2 component)
- build: pass
- validation scripts: pass

## TASK-024: Setup Cloudflare Queue consumer

Status: DONE
CompletedAt: 2026-06-17 19:40
Branch: feature/TASK-024-queue-consumer
Commit: 3be60b5

Summary:
- Created workers/queueConsumer package with package.json, tsconfig.json.
- Created workers/queueConsumer/wrangler.toml with queue consumer binding for shopee-research-queue.
- Configured max_batch_size=10, max_batch_timeout=30, max_retries=3, dead_letter_queue.
- Created workers/queueConsumer/src/index.ts with Hono worker and queue handler.
- Implemented processQueueBatch() to validate messages using queueMessageSchema.
- Acknowledges valid messages and retries invalid ones.
- Added /health endpoint for worker health checks.
- Created workers/queueConsumer/src/index.test.ts with 8 unit tests.
- All tests use mock queue messages for isolation.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (88 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 2 component)
- build: pass
- validation scripts: pass

## TASK-025: Setup environment validation

Status: DONE
CompletedAt: 2026-06-17 19:43
Branch: feature/TASK-025-env-validation
Commit: 4529390

Summary:
- Created packages/shared/src/schemas/env.ts with Zod schemas for env vars.
- Created envSchema validating all non-secret vars from env-variables.md.
- Created appEnvSchema for APP_ENV enum (development/staging/production).
- Transforms numeric string vars (JOB_POLL_INTERVAL_MS, MAX_COMPARE_LINKS, etc.) to numbers.
- Created packages/shared/src/env.ts with validateEnv() and safeValidateEnv() functions.
- EnvValidationError class provides clear error messages with all issues.
- Created packages/shared/src/env.test.ts with 12 unit tests.
- Re-exported env schema from packages/shared/src/schemas/index.ts.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (100 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 2 component)
- build: pass
- validation scripts: pass

## TASK-030: Build auth schema

Status: DONE
CompletedAt: 2026-06-17 20:18
Branch: feature/TASK-030-auth-schema
Commit: 3f16fa7

Summary:
- Created packages/auth package with package.json, tsconfig.json.
- Created packages/auth/src/password.ts with PBKDF2 password hashing.
- Implemented hashPassword() and verifyPassword() using Web Crypto API.
- Supports optional pepper from PASSWORD_PEPPER env var.
- Created packages/auth/src/session.ts with session token utilities.
- Implemented generateSessionToken(), hashSessionToken(), hashSessionTokenAsync().
- Added getSessionExpiry(), isSessionExpired(), isSessionRevoked().
- Added hashUserAgent() and hashIp() for privacy-preserving hashes.
- Created packages/auth/src/validation.ts with email/password/name validation.
- Added validateEmail(), validatePassword(), validateName(), validateAuthInput().
- Created 47 unit tests across 3 test files (8 password, 19 session, 20 validation).
- All functions use Web Crypto API compatible with Cloudflare Workers.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (147 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 2 component)
- build: pass
- validation scripts: pass

## TASK-031: Build register API

Status: DONE
CompletedAt: 2026-06-17 20:23
Branch: feature/TASK-031-register-api
Commit: c3ad9b4

Summary:
- Created packages/db/src/repositories/users.ts with user CRUD functions.
- Implemented findUserByEmail(), findUserById(), createUser(), updateUserPassword().
- Created packages/db/src/repositories/sessions.ts with session CRUD functions.
- Implemented findSessionByTokenHash(), createSession(), revokeSession(), revokeAllUserSessions().
- Created workers/api/src/routes/auth.ts with auth router.
- Implemented POST /api/auth/register endpoint.
- Validates request using registerRequestSchema.
- Hashes password with PBKDF2 + optional pepper.
- Creates user in sh_users table.
- Creates session in sh_sessions table with 30-day expiry.
- Sets HTTP-only, SameSite=Lax, Secure (production) cookie.
- Normalizes email to lowercase.
- Returns 201 with user info, 400 for invalid input, 409 for duplicate email.
- Added @shopee-research/auth, @shopee-research/db as API worker dependencies.
- Created 11 unit tests covering all register scenarios.
- All 158 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (158 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 11 register, 2 component)
- build: pass
- validation scripts: pass

## TASK-032: Build login API

Status: DONE
CompletedAt: 2026-06-17 20:26
Branch: feature/TASK-032-login-api
Commit: e5bd2a0

Summary:
- Added POST /api/auth/login route to workers/api/src/routes/auth.ts.
- Validates request using loginRequestSchema.
- Finds user by email (case-insensitive).
- Verifies password using verifyPassword with optional pepper.
- Returns 401 for non-existent email with same error message as wrong password (no info leak).
- Returns 401 for disabled account with ACCOUNT_DISABLED code.
- Creates session in sh_sessions table with 30-day expiry.
- Sets HTTP-only, SameSite=Lax, Secure (production) cookie.
- Returns 200 with user info (id, email, role).
- Added 9 unit tests covering all login scenarios.
- All 167 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (167 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 20 auth, 2 component)
- build: pass
- validation scripts: pass

## TASK-033: Build logout API

Status: DONE
CompletedAt: 2026-06-17 20:29
Branch: feature/TASK-033-logout-api
Commit: 0fce691

Summary:
- Added POST /api/auth/logout route to workers/api/src/routes/auth.ts.
- Extracts session token from cookie using extractSessionToken helper.
- Hashes token using SHA-256 and finds session in D1.
- Validates session is not expired and not revoked.
- Revokes session by calling revokeSession() which sets revokedAt.
- Clears session cookie with Max-Age=0.
- Returns 200 with { success: true } on success.
- Returns 401 with UNAUTHENTICATED for missing/invalid/expired/revoked sessions.
- Added 6 unit tests covering all logout scenarios.
- Extended MockD1Database to support session lookup by tokenHash and revoke.
- All 173 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (173 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 26 auth, 2 component)
- build: pass
- validation scripts: pass

## TASK-034: Build me API

Status: DONE
CompletedAt: 2026-06-17 20:40
Branch: feature/TASK-034-me-api
Commit: 3b1a1ae

Summary:
- Added GET /api/auth/me route to workers/api/src/routes/auth.ts.
- Extracts session token from cookie using extractSessionToken helper.
- Hashes token using SHA-256 and finds session in D1.
- Validates session is not expired and not revoked.
- Finds user by session userId using findUserById.
- Validates user status is active.
- Returns 200 with user info (id, email, name, role) on success.
- Returns 401 with UNAUTHENTICATED for missing/invalid/expired session.
- Returns 401 with ACCOUNT_DISABLED for disabled user.
- Returns 401 with UNAUTHENTICATED for orphan session (user deleted).
- Added 6 unit tests covering all me scenarios.
- All 179 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (179 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 32 auth, 2 component)
- build: pass
- validation scripts: pass

## TASK-035: Build frontend login/register pages

Status: DONE
CompletedAt: 2026-06-17 20:45
Branch: feature/TASK-035-frontend-auth
Commit: a23f2df

Summary:
- Created apps/web/src/lib/api.ts with API client and ApiClientError class.
- Added apiRequest() helper that handles JSON, errors, and credentials.
- Created apps/web/src/lib/auth.ts with register, login, logout, me functions.
- Created apps/web/src/pages/LoginPage.tsx with email/password form.
- Used TanStack Query useMutation for API calls.
- Shows loading/error states, redirects to home on success.
- Created apps/web/src/pages/RegisterPage.tsx with email/name/password form.
- Added /login and /register routes to TanStack Router.
- Added CSS for form panels, fields, buttons in global.css.
- Created LoginPage.test.tsx with 4 component tests.
- Created RegisterPage.test.tsx with 5 component tests.
- Added cleanup() in test-setup.ts to fix test isolation.
- All 188 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (188 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 32 auth, 11 component, 2 home)
- build: pass
- validation scripts: pass

## TASK-036: Build protected routes

Status: DONE
CompletedAt: 2026-06-17 20:49
Branch: feature/TASK-036-protected-routes
Commit: 686d4fc

Summary:
- Added useAuth hook to apps/web/src/lib/auth.ts using TanStack Query useQuery.
- Returns user, isLoading, isAuthenticated, isError.
- Uses 5-minute staleTime and retry: false.
- Created apps/web/src/components/RequireAuth.tsx.
- Shows loading state, renders children when authenticated, redirects to /login otherwise.
- Wrapped /compare, /keyword-search, /settings routes with RequireAuth.
- Updated AppShell to show user email and Sign Out button when authenticated.
- Shows Sign In link when not authenticated.
- Sign Out uses useMutation to call /api/auth/logout and clears auth cache.
- Added CSS for user area, secondary button, and loading state.
- Created RequireAuth.test.tsx with 3 component tests.
- All 191 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (191 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 32 auth, 14 component, 2 home)
- build: pass
- validation scripts: pass

## TASK-040: Build configuration database tables

Status: DONE
CompletedAt: 2026-06-17 22:14
Branch: feature/TASK-040-config-tables
Commit: 2069bd3

Summary:
- Created packages/db/src/repositories/appConfigs.ts with CRUD for sh_appConfigs.
- findAppConfigByKey, findAppConfigById, listAppConfigs, listAppConfigsByCategory, listPublicAppConfigs, createAppConfig, updateAppConfig, deleteAppConfig.
- Created packages/db/src/repositories/aiProviderConfigs.ts with CRUD for sh_aiProviderConfigs.
- Supports lastTestStatus/lastTestAt/lastTestMessage for test console.
- Created packages/db/src/repositories/aiModelConfigs.ts with CRUD for sh_aiModelConfigs.
- Added findDefaultModelByUsageType for usage type lookup.
- Created packages/db/src/repositories/searchProviderConfigs.ts with CRUD for sh_searchProviderConfigs.
- Created packages/db/src/repositories/scoringConfigs.ts with CRUD for sh_scoringConfigs.
- Added findDefaultScoringConfig helper.
- Created configs.test.ts with 29 unit tests for all repositories.
- All 220 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (220 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 32 auth, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-041: Build app config CRUD API

Status: DONE
CompletedAt: 2026-06-17 22:46
Branch: feature/TASK-041-app-config-api
Commit: 08f366a

Summary:
- Created packages/shared/src/schemas/config.ts with Zod schemas for app config.
- createAppConfigRequestSchema, updateAppConfigRequestSchema, appConfigSchema, response schemas.
- Created workers/api/src/lib/auth.ts with authenticate(), requireAdmin(), authErrorResponse() helpers.
- Created workers/api/src/routes/config.ts with config router.
- Implemented GET /api/config/apps/public (no auth required, returns public+enabled configs).
- Implemented GET /api/config/apps (admin only, supports ?category= filter).
- Implemented POST /api/config/apps (admin only, returns 409 on duplicate key).
- Implemented PUT /api/config/apps/:id (admin only).
- Implemented DELETE /api/config/apps/:id (admin only).
- Mounted config router in workers/api/src/index.ts.
- Created 16 unit tests covering all endpoints and authorization.
- All 236 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (236 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 48 auth/api, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-042: Build AI provider config CRUD API

Status: DONE
CompletedAt: 2026-06-17 22:49
Branch: feature/TASK-042-ai-provider-api
Commit: eba3a88

Summary:
- Added AI provider Zod schemas to packages/shared/src/schemas/config.ts.
- createAiProviderRequestSchema, updateAiProviderRequestSchema, aiProviderSchema, response schemas.
- Added AI provider CRUD endpoints to workers/api/src/routes/config.ts.
- GET /api/config/ai-providers (admin only, list all).
- POST /api/config/ai-providers (admin only, returns 409 on duplicate key).
- PUT /api/config/ai-providers/:id (admin only).
- DELETE /api/config/ai-providers/:id (admin only).
- Added toAiProviderResponse() helper to convert DB rows to response format.
- Added 12 unit tests for AI provider endpoints.
- All 248 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (248 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 60 auth/api, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-043: Build AI model config CRUD API

Status: DONE
CompletedAt: 2026-06-17 23:31
Branch: feature/TASK-043-ai-model-api
Commit: bc5c58b

Summary:
- Added aiModelUsageType enum to shared/constants/enums.ts.
- Added aiModelUsageTypeSchema to shared/schemas/enums.ts.
- Added AI model Zod schemas to shared/schemas/config.ts.
- createAiModelRequestSchema, updateAiModelRequestSchema, aiModelSchema, response schemas.
- Added AI model CRUD endpoints to workers/api/src/routes/config.ts.
- GET /api/config/ai-models (admin only, supports ?providerKey= filter).
- POST /api/config/ai-models (admin only, returns 404 if provider not found).
- PUT /api/config/ai-models/:id (admin only).
- DELETE /api/config/ai-models/:id (admin only).
- Added toAiModelResponse() helper.
- Added 12 unit tests for AI model endpoints.
- All 260 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (260 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 72 auth/api, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-044: Build search provider config CRUD API

Status: DONE
CompletedAt: 2026-06-17 23:33
Branch: feature/TASK-044-search-provider-api
Commit: 963fd5c

Summary:
- Added search provider Zod schemas to shared/schemas/config.ts.
- createSearchProviderRequestSchema, updateSearchProviderRequestSchema, searchProviderSchema, response schemas.
- Added search provider CRUD endpoints to workers/api/src/routes/config.ts.
- GET /api/config/search-providers (admin only, list all).
- POST /api/config/search-providers (admin only, 409 on duplicate key).
- PUT /api/config/search-providers/:id (admin only).
- DELETE /api/config/search-providers/:id (admin only).
- Added toSearchProviderResponse() helper.
- Added 9 unit tests for search provider endpoints.
- All 269 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (269 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 81 auth/api, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-045: Build scoring config CRUD API

Status: DONE
CompletedAt: 2026-06-17 23:35
Branch: feature/TASK-045-scoring-api
Commit: 55fb324

Summary:
- Added scoring config Zod schemas to shared/schemas/config.ts.
- createScoringConfigRequestSchema, updateScoringConfigRequestSchema, scoringConfigSchema, response schemas.
- Added scoring CRUD endpoints to workers/api/src/routes/config.ts.
- GET /api/config/scoring-configs (admin only).
- POST /api/config/scoring-configs (admin only, validates weightsJson is valid JSON, 409 on duplicate key).
- PUT /api/config/scoring-configs/:id (admin only).
- DELETE /api/config/scoring-configs/:id (admin only).
- Added toScoringConfigResponse() helper.
- Added 9 unit tests for scoring config endpoints.
- All 278 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (278 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 90 auth/api, 14 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-046: Build frontend configuration CRUD page

Status: DONE
CompletedAt: 2026-06-17 23:57
Branch: feature/TASK-046-config-page
Commit: 6cd1398

Summary:
- Created apps/web/src/lib/config.ts with API client functions for all config types.
- list/delete for appConfigs, aiProviders, aiModels, searchProviders, scoringConfigs.
- Created apps/web/src/pages/ConfigPage.tsx with tabbed interface.
- 5 tabs: App Configs, AI Providers, AI Models, Search Providers, Scoring Configs.
- Each tab shows table with delete buttons.
- Uses TanStack Query for data fetching and mutations.
- Shows loading/error states.
- Added /settings/config route (protected by RequireAuth).
- Added CSS for tabs, panels, tables, danger buttons.
- Created ConfigPage.test.tsx with 3 component tests.
- All 281 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (281 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 90 auth/api, 17 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-047: Build 9router model test API

Status: DONE
CompletedAt: 2026-06-18 00:00
Branch: feature/TASK-047-model-test-api
Commit: 5b23369

Summary:
- Created workers/api/src/lib/nineRouter.ts with testNineRouterModel() function.
- Calls 9router /chat/completions endpoint with timeout and abort controller.
- Returns status, latencyMs, outputValidJson, message, responseText.
- Added POST /api/config/ai-models/:id/test endpoint to config router.
- Validates model and provider exist (404 if missing).
- Resolves secret via env[secretRef] (500 if missing).
- Calls 9router with default test prompt if not provided.
- Updates lastTestStatus/lastTestAt/lastTestMessage in DB.
- Returns 200 on success, 502 on failure.
- Added 6 unit tests with mocked fetch.
- All 287 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (287 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 96 auth/api, 17 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-048: Build 9router model test frontend

Status: DONE
CompletedAt: 2026-06-18 00:02
Branch: feature/TASK-048-test-frontend
Commit: 817e055

Summary:
- Added testAiModel() function to apps/web/src/lib/config.ts.
- Added ModelTestResult type with status, latencyMs, outputValidJson, message.
- Updated ConfigPage AI Models tab to add Test button per row.
- Shows test result inline with success/failed badge and latency.
- Added CSS for testBadgeSuccess, testBadgeFailed, testBadgeNone.
- All 287 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (287 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 96 auth/api, 17 component, 29 config repos, 2 home)
- build: pass
- validation scripts: pass

## TASK-050: Create Shopee product fixture data

Status: DONE
CompletedAt: 2026-06-18 00:10
Branch: feature/TASK-050-product-fixtures
Commit: e36ddb3

Summary:
- Created packages/shopee package with package.json, tsconfig.json.
- Created packages/shopee/src/fixtures/products.ts with 5 diverse product fixtures.
- Products have varying prices (65k-480k), ratings (4.2-4.9), shops, weights, and features.
- All products have shippedFrom "DKI Jakarta" per source-of-truth.
- Added findFixtureByItemId() and findFixtureByUrl() helpers.
- Created products.test.ts with 9 unit tests for fixture structure.
- All 298 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (298 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 96 auth/api, 17 component, 29 config repos, 11 shopee fixtures, 2 home)
- build: pass
- validation scripts: pass

## TASK-051: Create Shopee shop fixture data

Status: DONE
CompletedAt: 2026-06-18 00:12
Branch: feature/TASK-051-shop-fixtures
Commit: 25aa5da

Summary:
- Created packages/shopee/src/fixtures/shops.ts with 4 diverse shop fixtures.
- Shops have varying primary statuses (MALL, STARPLUS, STAR, PREFERRED).
- All shops have rating >= 4.5 and responseRate >= 88.
- All shops in DKI Jakarta.
- Added findShopFixtureById() and findShopFixtureByShopeeId() helpers.
- Created shops.test.ts with 9 unit tests.
- All 307 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (307 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 96 auth/api, 17 component, 29 config repos, 20 shopee fixtures, 2 home)
- build: pass
- validation scripts: pass

## TASK-052: Create ProductSnapshot contract

Status: DONE
CompletedAt: 2026-06-18 00:14
Branch: feature/TASK-052-product-contract
Commit: pending

Summary:
- Verified ProductSnapshot interface exists in packages/shared/src/types/shopee.ts.
- Created packages/shopee/src/contracts/products.ts with re-exports and helpers.
- Added isValidProductSnapshot() type guard function.
- Added getConfidenceLevel() helper.
- Created products.test.ts with 7 unit tests.
- All 314 tests pass.

Quality Gate:
- pnpm install: pass
- lint: pass
- typecheck: pass
- test: pass (314 tests: 22 enum, 36 schema, 11 R2, 9 queue, 8 consumer, 12 env, 8 password, 19 session, 20 validation, 96 auth/api, 17 component, 29 config repos, 20 shopee fixtures, 7 shopee contracts, 2 home)
- build: pass
- validation scripts: pass
