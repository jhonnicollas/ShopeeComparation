import type { SearchInput, SearchProvider, SearchResultCandidate } from "@shopee-research/shared";

export interface CandidateCollectionResult {
  candidates: SearchResultCandidate[];
  perProviderCount: Record<string, number>;
  failedProviders: string[];
}

export interface CandidateCollectorOptions {
  providers: SearchProvider[];
}

function dedupeKey(c: SearchResultCandidate): string {
  if (c.shopId && c.itemId) {
    return `id:${c.shopId}:${c.itemId}`;
  }
  if (c.canonicalUrl) {
    return `url:${c.canonicalUrl}`;
  }
  if (c.originalUrl) {
    return `url:${c.originalUrl}`;
  }
  return `title:${c.title ?? ""}:${c.priceMin ?? ""}`;
}

function pickBetter(
  current: SearchResultCandidate,
  incoming: SearchResultCandidate
): SearchResultCandidate {
  if ((incoming.confidence ?? 0) > (current.confidence ?? 0)) return incoming;
  return current;
}

export class CandidateCollector {
  private providers: SearchProvider[];

  constructor(options: CandidateCollectorOptions) {
    this.providers = options.providers;
  }

  async collect(input: SearchInput): Promise<CandidateCollectionResult> {
    const dedupeMap = new Map<string, SearchResultCandidate>();
    const perProviderCount: Record<string, number> = {};
    const failedProviders: string[] = [];

    for (const provider of this.providers) {
      try {
        const results = await provider.search(input);
        const count = results.length;
        perProviderCount[provider.key] = count;
        for (const candidate of results) {
          const key = dedupeKey(candidate);
          const existing = dedupeMap.get(key);
          if (!existing) {
            dedupeMap.set(key, candidate);
          } else {
            dedupeMap.set(key, pickBetter(existing, candidate));
          }
        }
      } catch {
        failedProviders.push(provider.key);
        perProviderCount[provider.key] = 0;
      }
    }

    const candidates: SearchResultCandidate[] = Array.from(dedupeMap.values());
    candidates.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    const limit = input.limit > 0 ? input.limit : 10;
    return {
      candidates: candidates.slice(0, limit),
      perProviderCount,
      failedProviders,
    };
  }
}
