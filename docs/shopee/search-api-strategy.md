# Shopee Search API Strategy

## Purpose

Dokumen ini mendefinisikan strategi pencarian produk Shopee untuk workflow Keyword Search Top 10.

## Goal

User memasukkan keyword dan filter `shippedFrom = DKI Jakarta`, lalu sistem mengembalikan 10 produk terbaik berdasarkan data produk, toko, fitur, berat produk, rating, review, total terjual, dan scoring engine.

## Core Principle

Search strategy harus adapter-based, configurable dari frontend admin, dan tidak boleh hardcoded.

## Search Provider Priority

Default urutan provider:

1. Official or affiliate API jika akses tersedia dan legal untuk use case.
2. Shopee lightweight web search fetch.
3. 9router web fetch provider.
4. Cloudflare Browser Run fallback.
5. Optional VPS scraper fallback jika dikonfigurasi.

Urutan ini harus disimpan di D1 table `sh_searchProviderConfigs` dan bisa diubah dari frontend admin.

## Search Provider Interface

```ts
export interface SearchProvider {
  key: string;
  search(input: SearchInput): Promise<SearchResultCandidate[]>;
}

export type SearchInput = {
  keyword: string;
  shippedFrom: string;
  limit: number;
  priceMin?: number;
  priceMax?: number;
  minimumRating?: number;
  minimumReviewCount?: number;
  storeStatus?: string[];
};
```

## Search Candidate Output

```ts
export type SearchResultCandidate = {
  title: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  itemId: string | null;
  shopId: string | null;
  priceMin: number | null;
  priceMax: number | null;
  rating: number | null;
  reviewCount: number | null;
  soldCount: number | null;
  shippedFrom: string | null;
  shopName: string | null;
  source: string;
  confidence: number;
};
```

## Keyword Search Workflow

1. Validate keyword.
2. Load active search provider config from D1.
3. Generate query plan with Mastra if needed.
4. Fetch candidates from provider priority order.
5. Deduplicate by `shopId + itemId` or canonical URL.
6. Filter by shipped from, default `DKI Jakarta`.
7. Select more than 10 candidates for enrichment if possible.
8. Enrich product detail.
9. Enrich shop detail.
10. Extract product weight.
11. Score all candidates.
12. Return top 10.
13. Generate AI report using configured 9router model.

## Compliance Rules

The system must not:

- Login to Shopee user account.
- Access cart, checkout, order, user, or me pages.
- Bypass CAPTCHA.
- Collect personal data.
- Scrape aggressively.

## Retry Rules

- Retry only transient failures.
- Do not retry CAPTCHA or forbidden responses aggressively.
- Use exponential backoff.
- Mark `partialSuccess` if some candidates fail.

## Data Quality Rules

Every field from search provider must include:

- value
- source
- confidence

If shipped from cannot be verified, product must not be treated as confirmed DKI Jakarta. It can only be marked as `unknown`.

## Admin Configuration

Search provider settings must be configurable from frontend:

- providerKey
- displayName
- priority
- baseUrl
- authType
- secretRef
- isEnabled
- timeoutMs
- retryCount
- notes
- lastTestStatus
- lastTestAt
- lastTestMessage

Secret values are not stored in D1.
