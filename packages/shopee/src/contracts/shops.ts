import type { ShopSnapshot } from "@shopee-research/shared";
export type { ShopSnapshot } from "@shopee-research/shared";

export function isValidShopSnapshot(snapshot: unknown): snapshot is ShopSnapshot {
  if (!snapshot || typeof snapshot !== "object") return false;
  const s = snapshot as Record<string, unknown>;
  return (
    typeof s.shopeeShopId === "string" &&
    typeof s.name === "string" &&
    typeof s.confidenceScore === "number"
  );
}

export function getShopTrustLevel(
  primaryStatus: string | null,
  rating: number | null,
  responseRate: number | null
): "high" | "medium" | "low" {
  if (
    primaryStatus === "MALL" ||
    primaryStatus === "OFFICIAL" ||
    (rating !== null && rating >= 4.7 && responseRate !== null && responseRate >= 95)
  ) {
    return "high";
  }
  if (
    primaryStatus === "STARPLUS" ||
    primaryStatus === "STAR" ||
    (rating !== null && rating >= 4.3 && responseRate !== null && responseRate >= 85)
  ) {
    return "medium";
  }
  return "low";
}
