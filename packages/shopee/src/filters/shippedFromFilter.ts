import type { SearchResultCandidate } from "@shopee-research/shared";

export interface FilterResult {
  kept: SearchResultCandidate[];
  dropped: SearchResultCandidate[];
  keptCount: number;
  droppedCount: number;
}

function normalize(value: string | null): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export function filterByShippedFrom(
  candidates: SearchResultCandidate[],
  shippedFrom: string
): FilterResult {
  const target = normalize(shippedFrom);
  const kept: SearchResultCandidate[] = [];
  const dropped: SearchResultCandidate[] = [];

  for (const candidate of candidates) {
    const value = normalize(candidate.shippedFrom);
    if (!value) {
      dropped.push(candidate);
      continue;
    }
    if (value === target) {
      kept.push(candidate);
    } else {
      dropped.push(candidate);
    }
  }

  return {
    kept,
    dropped,
    keptCount: kept.length,
    droppedCount: dropped.length,
  };
}
