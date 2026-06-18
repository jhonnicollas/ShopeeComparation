import type { ResolveUrlInput, ResolveUrlResult } from "@shopee-research/shared";
import { ResolveUrlAdapter } from "./resolveUrl.js";

export class BrowserRunResolveAdapter implements ResolveUrlAdapter {
  name = "browserRun";

  async resolve(input: ResolveUrlInput): Promise<ResolveUrlResult> {
    return {
      originalUrl: input.url,
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "browserRun",
      status: "failed",
      errorMessage: "Cloudflare Browser Run not implemented (TASK-091)",
    };
  }
}