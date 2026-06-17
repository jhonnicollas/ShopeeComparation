# Shopee URL Resolver

## Goal

Convert user-provided Shopee URL into canonical product URL and identifiers.

## Supported Input

- `https://id.shp.ee/...`
- `https://shopee.co.id/product/{shopId}/{itemId}`
- Shopee product URL with tracking parameters
- Mobile Shopee URL if product identifiers can be extracted

## Output

```ts
export type ResolveUrlResult = {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  shopId: string | null;
  itemId: string | null;
  resolveMethod: "direct" | "redirect" | "webFetch" | "browserRun" | "manual";
  status: "resolved" | "failed";
  errorMessage?: string;
};
```

## Rules

- Preserve original URL.
- Remove tracking parameters from canonical URL.
- Do not fail entire comparison if one URL fails.
- Failed URL should become partial success item.
