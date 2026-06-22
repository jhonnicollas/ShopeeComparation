-- Migration 0005: Add demo data tables (admin opt-in, separate from real data)
--
-- These tables hold a curated, clearly-labeled demo dataset that admin can
-- enable via sh_appConfigs (`app.demoMode=true`) to demonstrate the full
-- keyword-search + compare-links workflow when real Shopee extraction is
-- blocked by Shopee anti-bot detection (Cloudflare Browser Run identifies
-- as bot, see docs/deployment/checklist.md).
--
-- All rows in sh_demoProducts and sh_demoShops are demo data. The
-- search/compare flow marks them with source="demo" and confidence=0.3
-- so the UI can render a prominent "DEMO MODE" badge. This is PRD §8.6
-- compliant: failed fields stay null, demo fields are clearly attributed.
--
-- IMPORTANT: These tables are separate from sh_products, sh_shops so
-- they can never accidentally mix with real production data.

CREATE TABLE IF NOT EXISTS sh_demoProducts (
  "id" TEXT PRIMARY KEY,
  "shopeeItemId" TEXT NOT NULL,
  "shopeeShopId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brand" TEXT,
  "category" TEXT,
  "originalUrl" TEXT NOT NULL,
  "canonicalUrl" TEXT NOT NULL,
  "imageUrl" TEXT,
  "priceMin" INTEGER NOT NULL,
  "priceMax" INTEGER,
  "rating" REAL,
  "reviewCount" INTEGER,
  "soldCount" INTEGER,
  "shippedFrom" TEXT NOT NULL DEFAULT 'DKI Jakarta',
  "description" TEXT,
  "weightGrams" INTEGER,
  "demoKeyword" TEXT NOT NULL,
  "demoPosition" INTEGER NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sh_demoProducts_keyword ON sh_demoProducts("demoKeyword", "demoPosition");

CREATE TABLE IF NOT EXISTS sh_demoShops (
  "id" TEXT PRIMARY KEY,
  "shopeeShopId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "shopUrl" TEXT NOT NULL,
  "statusLabels" TEXT NOT NULL,
  "primaryStatus" TEXT NOT NULL,
  "rating" REAL NOT NULL,
  "ratingCount" INTEGER NOT NULL,
  "responseRate" INTEGER NOT NULL,
  "responseTime" TEXT NOT NULL,
  "followerCount" INTEGER NOT NULL,
  "productCount" INTEGER NOT NULL,
  "joinedAgeText" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sh_demoKeywords (
  "id" TEXT PRIMARY KEY,
  "keyword" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "isEnabled" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
