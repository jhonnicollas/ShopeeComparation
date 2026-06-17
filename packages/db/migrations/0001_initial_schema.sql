-- Initial D1 schema for Shopee Product Research AI
-- All tables use sh_ prefix, all columns use camelCase without underscores
-- See docs/database/schema.md for full schema documentation

CREATE TABLE IF NOT EXISTS sh_users (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "passwordSalt" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_sessions (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userAgentHash" TEXT,
  "ipHash" TEXT,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "revokedAt" TEXT,
  FOREIGN KEY ("userId") REFERENCES sh_users("id")
);

CREATE TABLE IF NOT EXISTS sh_researchSessions (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "keyword" TEXT,
  "shippedFrom" TEXT,
  "status" TEXT NOT NULL,
  "bestProductId" TEXT,
  "totalProducts" INTEGER NOT NULL DEFAULT 0,
  "completedProducts" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES sh_users("id")
);

CREATE TABLE IF NOT EXISTS sh_resolvedUrls (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "finalUrl" TEXT,
  "canonicalUrl" TEXT,
  "shopId" TEXT,
  "itemId" TEXT,
  "resolveMethod" TEXT,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES sh_users("id")
);

CREATE TABLE IF NOT EXISTS sh_products (
  "id" TEXT PRIMARY KEY,
  "shopeeItemId" TEXT,
  "shopeeShopId" TEXT,
  "title" TEXT,
  "brand" TEXT,
  "category" TEXT,
  "originalUrl" TEXT,
  "canonicalUrl" TEXT,
  "imageUrl" TEXT,
  "galleryJson" TEXT,
  "videoUrl" TEXT,
  "priceMin" INTEGER,
  "priceMax" INTEGER,
  "priceBeforeDiscount" INTEGER,
  "discountText" TEXT,
  "rating" REAL,
  "reviewCount" INTEGER,
  "soldCount" INTEGER,
  "favoriteCount" INTEGER,
  "stock" INTEGER,
  "shippedFrom" TEXT,
  "description" TEXT,
  "specificationJson" TEXT,
  "variationJson" TEXT,
  "confidenceScore" REAL NOT NULL DEFAULT 0,
  "rawSnapshotR2Key" TEXT,
  "lastCheckedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_productWeights (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "value" REAL,
  "unit" TEXT,
  "rawText" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("productId") REFERENCES sh_products("id")
);

CREATE TABLE IF NOT EXISTS sh_shops (
  "id" TEXT PRIMARY KEY,
  "shopeeShopId" TEXT UNIQUE,
  "name" TEXT,
  "shopUrl" TEXT,
  "statusJson" TEXT,
  "primaryStatus" TEXT,
  "rating" REAL,
  "ratingCount" INTEGER,
  "responseRate" REAL,
  "responseTime" TEXT,
  "followerCount" INTEGER,
  "productCount" INTEGER,
  "joinedAgeText" TEXT,
  "location" TEXT,
  "confidenceScore" REAL NOT NULL DEFAULT 0,
  "rawSnapshotR2Key" TEXT,
  "lastCheckedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_productFeatures (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("productId") REFERENCES sh_products("id")
);

CREATE TABLE IF NOT EXISTS sh_comparisons (
  "id" TEXT PRIMARY KEY,
  "researchSessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "mode" TEXT NOT NULL,
  "keyword" TEXT,
  "shippedFrom" TEXT,
  "bestProductId" TEXT,
  "summary" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("researchSessionId") REFERENCES sh_researchSessions("id"),
  FOREIGN KEY ("userId") REFERENCES sh_users("id")
);

CREATE TABLE IF NOT EXISTS sh_comparisonItems (
  "id" TEXT PRIMARY KEY,
  "comparisonId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "shopId" TEXT,
  "rank" INTEGER,
  "finalScore" REAL NOT NULL DEFAULT 0,
  "ratingScore" REAL NOT NULL DEFAULT 0,
  "reviewCountScore" REAL NOT NULL DEFAULT 0,
  "soldCountScore" REAL NOT NULL DEFAULT 0,
  "priceScore" REAL NOT NULL DEFAULT 0,
  "shopTrustScore" REAL NOT NULL DEFAULT 0,
  "responseRateScore" REAL NOT NULL DEFAULT 0,
  "featureMatchScore" REAL NOT NULL DEFAULT 0,
  "riskPenalty" REAL NOT NULL DEFAULT 0,
  "prosJson" TEXT,
  "consJson" TEXT,
  "riskJson" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("comparisonId") REFERENCES sh_comparisons("id"),
  FOREIGN KEY ("productId") REFERENCES sh_products("id"),
  FOREIGN KEY ("shopId") REFERENCES sh_shops("id")
);

CREATE TABLE IF NOT EXISTS sh_aiReports (
  "id" TEXT PRIMARY KEY,
  "comparisonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "model" TEXT,
  "provider" TEXT,
  "promptVersion" TEXT,
  "reportJson" TEXT,
  "reportText" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "rawResponseR2Key" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("comparisonId") REFERENCES sh_comparisons("id"),
  FOREIGN KEY ("userId") REFERENCES sh_users("id")
);

CREATE TABLE IF NOT EXISTS sh_jobs (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "researchSessionId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "progressCurrent" INTEGER NOT NULL DEFAULT 0,
  "progressTotal" INTEGER NOT NULL DEFAULT 0,
  "currentStep" TEXT,
  "payloadJson" TEXT,
  "errorMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES sh_users("id"),
  FOREIGN KEY ("researchSessionId") REFERENCES sh_researchSessions("id")
);

CREATE TABLE IF NOT EXISTS sh_jobLogs (
  "id" TEXT PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("jobId") REFERENCES sh_jobs("id")
);

CREATE TABLE IF NOT EXISTS sh_rawSnapshots (
  "id" TEXT PRIMARY KEY,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "r2Key" TEXT NOT NULL,
  "contentType" TEXT,
  "sizeBytes" INTEGER,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_fieldEvidence (
  "id" TEXT PRIMARY KEY,
  "ownerType" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "valueText" TEXT,
  "source" TEXT,
  "confidence" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "rawSnapshotR2Key" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_appConfigs (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT,
  "valueType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_aiProviderConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "authType" TEXT NOT NULL,
  "secretRef" TEXT,
  "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
  "retryCount" INTEGER NOT NULL DEFAULT 1,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_aiModelConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL,
  "modelKey" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "displayName" TEXT,
  "usageType" TEXT NOT NULL,
  "contextWindow" INTEGER,
  "supportsJson" INTEGER NOT NULL DEFAULT 0,
  "supportsTools" INTEGER NOT NULL DEFAULT 0,
  "supportsVision" INTEGER NOT NULL DEFAULT 0,
  "costInput" REAL,
  "costOutput" REAL,
  "isDefault" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("providerKey") REFERENCES sh_aiProviderConfigs("providerKey")
);

CREATE TABLE IF NOT EXISTS sh_searchProviderConfigs (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "providerType" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "baseUrl" TEXT,
  "authType" TEXT NOT NULL DEFAULT 'none',
  "secretRef" TEXT,
  "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
  "retryCount" INTEGER NOT NULL DEFAULT 1,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "lastTestStatus" TEXT,
  "lastTestAt" TEXT,
  "lastTestMessage" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_scoringConfigs (
  "id" TEXT PRIMARY KEY,
  "configKey" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'default',
  "weightsJson" TEXT NOT NULL,
  "isDefault" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sh_sessions_userId ON sh_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sh_researchSessions_userId ON sh_researchSessions("userId");
CREATE INDEX IF NOT EXISTS idx_sh_resolvedUrls_userId ON sh_resolvedUrls("userId");
CREATE INDEX IF NOT EXISTS idx_sh_resolvedUrls_shopId_itemId ON sh_resolvedUrls("shopId", "itemId");
CREATE INDEX IF NOT EXISTS idx_sh_products_shopeeItemId ON sh_products("shopeeItemId");
CREATE INDEX IF NOT EXISTS idx_sh_products_shopeeShopId ON sh_products("shopeeShopId");
CREATE INDEX IF NOT EXISTS idx_sh_productWeights_productId ON sh_productWeights("productId");
CREATE INDEX IF NOT EXISTS idx_sh_productFeatures_productId ON sh_productFeatures("productId");
CREATE INDEX IF NOT EXISTS idx_sh_comparisons_researchSessionId ON sh_comparisons("researchSessionId");
CREATE INDEX IF NOT EXISTS idx_sh_comparisons_userId ON sh_comparisons("userId");
CREATE INDEX IF NOT EXISTS idx_sh_comparisonItems_comparisonId ON sh_comparisonItems("comparisonId");
CREATE INDEX IF NOT EXISTS idx_sh_comparisonItems_productId ON sh_comparisonItems("productId");
CREATE INDEX IF NOT EXISTS idx_sh_aiReports_comparisonId ON sh_aiReports("comparisonId");
CREATE INDEX IF NOT EXISTS idx_sh_jobs_userId ON sh_jobs("userId");
CREATE INDEX IF NOT EXISTS idx_sh_jobs_researchSessionId ON sh_jobs("researchSessionId");
CREATE INDEX IF NOT EXISTS idx_sh_jobs_status ON sh_jobs("status");
CREATE INDEX IF NOT EXISTS idx_sh_jobLogs_jobId ON sh_jobLogs("jobId");
CREATE INDEX IF NOT EXISTS idx_sh_rawSnapshots_ownerType_ownerId ON sh_rawSnapshots("ownerType", "ownerId");
CREATE INDEX IF NOT EXISTS idx_sh_fieldEvidence_ownerType_ownerId ON sh_fieldEvidence("ownerType", "ownerId");
CREATE INDEX IF NOT EXISTS idx_sh_fieldEvidence_fieldName ON sh_fieldEvidence("fieldName");
CREATE INDEX IF NOT EXISTS idx_sh_appConfigs_key ON sh_appConfigs("key");
CREATE INDEX IF NOT EXISTS idx_sh_aiModelConfigs_providerKey_modelKey ON sh_aiModelConfigs("providerKey", "modelKey");
