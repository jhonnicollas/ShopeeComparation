import type { ProductSnapshot } from "@shopee-research/shared";
export type { ProductSnapshot } from "@shopee-research/shared";
export type { ProductFeatureItem, WeightExtraction } from "@shopee-research/shared";

export function isValidProductSnapshot(snapshot: unknown): snapshot is ProductSnapshot {
  if (!snapshot || typeof snapshot !== "object") return false;
  const s = snapshot as Record<string, unknown>;
  return (
    typeof s.shopeeItemId === "string" &&
    Array.isArray(s.features) &&
    typeof s.weight === "object" &&
    typeof s.confidenceScore === "number"
  );
}

export function getConfidenceLevel(confidenceScore: number): "low" | "medium" | "high" {
  if (confidenceScore >= 0.8) return "high";
  if (confidenceScore >= 0.5) return "medium";
  return "low";
}
