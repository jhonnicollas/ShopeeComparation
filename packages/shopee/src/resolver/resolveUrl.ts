import type { ResolveUrlInput, ResolveUrlResult } from "@shopee-research/shared";
import { parseShopeeUrl } from "./urlParser.js";
import { WebFetchResolveAdapter } from "./webFetchAdapter.js";
import { BrowserRunResolveAdapter } from "./browserRunAdapter.js";

export { WebFetchResolveAdapter } from "./webFetchAdapter.js";
export { BrowserRunResolveAdapter } from "./browserRunAdapter.js";

export interface ResolveUrlAdapter {
  name: string;
  resolve(input: ResolveUrlInput): Promise<ResolveUrlResult>;
}

export class DirectResolveAdapter implements ResolveUrlAdapter {
  name = "direct";
  async resolve(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    const parsed = parseShopeeUrl({ url: input.url });
    if (!parsed.isValid) {
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "manual",
        status: "failed",
        errorMessage: parsed.error ?? "Invalid URL",
      };
    }
    if (parsed.isShortUrl) {
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "redirect",
        status: "failed",
        errorMessage: "Short URL requires HTTP redirect (use redirect adapter)",
      };
    }
    return {
      originalUrl: input.url,
      finalUrl: input.url,
      canonicalUrl: parsed.normalizedUrl ?? input.url,
      shopId: parsed.shopId,
      itemId: parsed.itemId,
      resolveMethod: "manual",
      status: "resolved",
    };
  }
}

export class HttpRedirectResolveAdapter implements ResolveUrlAdapter {
  name = "redirect";
  async resolve(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(input.url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const finalUrl = response.url || input.url;
      const parsed = parseShopeeUrl({ url: finalUrl });
      return {
        originalUrl: input.url,
        finalUrl,
        canonicalUrl: parsed.normalizedUrl ?? finalUrl,
        shopId: parsed.shopId,
        itemId: parsed.itemId,
        resolveMethod: "redirect",
        status: "resolved",
      };
    } catch (error) {
      clearTimeout(timeout);
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        originalUrl: input.url,
        finalUrl: null,
        canonicalUrl: null,
        shopId: null,
        itemId: null,
        resolveMethod: "redirect",
        status: "failed",
        errorMessage: msg.slice(0, 200),
      };
    }
  }
}

export async function resolveUrlWithFallback(
  input: ResolveUrlInput,
  adapters: ResolveUrlAdapter[] = [
    new DirectResolveAdapter(),
    new HttpRedirectResolveAdapter(),
    new WebFetchResolveAdapter(),
    new BrowserRunResolveAdapter(),
  ]
): Promise<ResolveUrlResult & { adapterUsed: string }> {
  const errors: string[] = [];
  for (const adapter of adapters) {
    try {
      const result = await adapter.resolve(input);
      if (result.status === "resolved") {
        return { ...result, adapterUsed: adapter.name };
      }
      errors.push(`${adapter.name}: ${result.errorMessage ?? "failed"}`);
    } catch (error) {
      errors.push(`${adapter.name}: ${error instanceof Error ? error.message : "error"}`);
    }
  }
  return {
    originalUrl: input.url,
    finalUrl: null,
    canonicalUrl: null,
    shopId: null,
    itemId: null,
    resolveMethod: "manual",
    status: "failed",
    errorMessage: `All adapters failed: ${errors.join("; ")}`,
    adapterUsed: "none",
  };
}
