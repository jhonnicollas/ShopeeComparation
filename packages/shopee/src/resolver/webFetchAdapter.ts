import type { ResolveUrlInput, ResolveUrlResult } from "@shopee-research/shared";
import { ResolveUrlAdapter } from "./resolveUrl.js";

export class WebFetchResolveAdapter implements ResolveUrlAdapter {
  name = "webFetch";

  async resolve(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    return {
      originalUrl: input.url,
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "webFetch",
      status: "failed",
      errorMessage: "9router web fetch not implemented (TASK-090)",
    };
  }
}