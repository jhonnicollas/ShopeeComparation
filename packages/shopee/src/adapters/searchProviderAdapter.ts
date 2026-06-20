import type {
  SearchInput,
  SearchProvider,
  SearchResultCandidate,
} from "@shopee-research/shared";
import type { SearchProviderConfigRow } from "@shopee-research/shared";
import { findSearchProviderByKey } from "@shopee-research/db";
import { NineRouterFetchAdapter, type NineRouterFetchConfig } from "./nineRouterFetchAdapter.js";
import { BrowserRunAdapter, type BrowserRunConfig } from "./browserRunAdapter.js";

export interface SearchProviderAdapterOptions {
  providerKey: string;
  db: D1Database;
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /bearer\s+\S+/gi,
  /authorization\s*[:=]\s*\S+/gi,
];

function sanitizeForLog(msg: string): string {
  let sanitized = msg;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized.slice(0, 200);
}

function resolveApiKey(
  secretRef: string | null,
  env: Record<string, string | undefined>
): string {
  if (!secretRef) return "";
  return env[secretRef] ?? "";
}

function buildNineRouterAdapter(
  provider: SearchProviderConfigRow,
  env: Record<string, string | undefined>,
  fetchImpl?: typeof fetch
): NineRouterFetchAdapter {
  const config: NineRouterFetchConfig = {
    baseUrl: provider.baseUrl ?? "",
    apiKey: resolveApiKey(provider.secretRef, env),
    modelName: provider.providerKey,
    timeoutMs: provider.timeoutMs ?? 30000,
    retryCount: provider.retryCount ?? 1,
    providerKey: provider.providerKey,
  };
  return new NineRouterFetchAdapter({ config, ...(fetchImpl ? { fetchImpl } : {}) });
}

function buildBrowserRunAdapter(
  provider: SearchProviderConfigRow,
  env: Record<string, string | undefined>,
  fetchImpl?: typeof fetch
): BrowserRunAdapter {
  const config: BrowserRunConfig = {
    baseUrl: provider.baseUrl ?? "",
    apiKey: resolveApiKey(provider.secretRef, env),
    timeoutMs: provider.timeoutMs ?? 30000,
    providerKey: provider.providerKey,
  };
  return new BrowserRunAdapter({ config, ...(fetchImpl ? { fetchImpl } : {}) });
}

export class SearchProviderAdapter implements SearchProvider {
  key: string;
  private provider: SearchProviderConfigRow | null = null;
  private env: Record<string, string | undefined>;
  private db: D1Database;
  private fetchImpl?: typeof fetch;
  private loaded: boolean = false;
  private loadError: string | null = null;

  constructor(options: SearchProviderAdapterOptions) {
    this.key = options.providerKey;
    this.env = options.env;
    this.db = options.db;
    this.fetchImpl = options.fetchImpl;
  }

  async search(input: SearchInput): Promise<SearchResultCandidate[]> {
    try {
      const provider = await this.loadProvider();
      if (!provider) return [];

      switch (provider.providerType) {
        case "webFetch":
        case "9router": {
          const adapter = buildNineRouterAdapter(provider, this.env, this.fetchImpl);
          return await adapter.searchProducts(input);
        }
        case "browserRun": {
          const adapter = buildBrowserRunAdapter(provider, this.env, this.fetchImpl);
          return await adapter.searchProducts(input);
        }
        case "manual":
        case "officialApi": {
          return [];
        }
        default:
          return [];
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      this.loadError = sanitizeForLog(msg);
      return [];
    }
  }

  private async loadProvider(): Promise<SearchProviderConfigRow | null> {
    if (this.loaded) return this.provider;
    this.loaded = true;
    const provider = await findSearchProviderByKey(this.db, this.key);
    if (!provider || !provider.isEnabled) {
      this.provider = null;
      return null;
    }
    this.provider = provider;
    return provider;
  }

  setDb(db: D1Database): void {
    this.db = db;
    this.loaded = false;
    this.provider = null;
  }
}
