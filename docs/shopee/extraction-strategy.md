# Shopee Extraction Strategy

## Strategy Decision

Shopee extraction must be adapter-based. The app must not depend on one fragile scraping method.

Order of strategy:

1. Official API or affiliate API if available and suitable.
2. Direct fetch for URLs that return useful data.
3. 9router web fetch helper.
4. Cloudflare Browser Run fallback.
5. Optional VPS scraper fallback if Browser Run is insufficient.

## Compliance Rules

- Do not login to Shopee user account.
- Do not access cart.
- Do not access checkout.
- Do not access order pages.
- Do not access user/me pages.
- Do not bypass CAPTCHA.
- Do not scrape aggressively.
- Cache results.
- Store extraction timestamp.

## Adapter Interface

```ts
export interface ShopeeExtractor {
  resolveUrl(input: ResolveUrlInput): Promise<ResolveUrlResult>;
  searchProducts(input: SearchProductsInput): Promise<SearchProductsResult>;
  extractProduct(input: ExtractProductInput): Promise<ProductSnapshot>;
  extractShop(input: ExtractShopInput): Promise<ShopSnapshot>;
}
```

## Implementations

- `MockShopeeExtractor`
- `FetchShopeeExtractor`
- `NineRouterWebFetchExtractor`
- `BrowserRunShopeeExtractor`
- `FallbackShopeeExtractor`

## Development Rule

Build mock end-to-end flow first. Real extraction is added only after API, D1, UI, scoring, and AI report work with fixture data.
