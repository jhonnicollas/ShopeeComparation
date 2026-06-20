import type { ProductSnapshot, ShopSnapshot, RiskItem } from "@shopee-research/shared";

export interface RiskDetectionInput {
  product: ProductSnapshot;
  shop: ShopSnapshot | null;
}

export function detectRisks(input: RiskDetectionInput): RiskItem[] {
  const risks: RiskItem[] = [];
  risks.push(...checkRatingRisks(input.product));
  risks.push(...checkReviewRisks(input.product));
  risks.push(...checkShopRisks(input.shop));
  risks.push(...checkPriceRisks(input.product));
  risks.push(...checkStockRisks(input.product));
  return risks;
}

function checkRatingRisks(product: ProductSnapshot): RiskItem[] {
  const risks: RiskItem[] = [];
  if (product.rating !== null && product.rating < 3.5) {
    risks.push({
      type: "low_rating",
      severity: product.rating < 3.0 ? "HIGH" : "MEDIUM",
      message: `Product rating is low (${product.rating}/5)`,
      impact: 0.3,
    });
  }
  return risks;
}

function checkReviewRisks(product: ProductSnapshot): RiskItem[] {
  const risks: RiskItem[] = [];
  if (product.reviewCount !== null && product.reviewCount < 10) {
    risks.push({
      type: "few_reviews",
      severity: product.reviewCount < 5 ? "HIGH" : "MEDIUM",
      message: `Very few reviews (${product.reviewCount})`,
      impact: 0.2,
    });
  }
  return risks;
}

function checkShopRisks(shop: ShopSnapshot | null): RiskItem[] {
  const risks: RiskItem[] = [];
  if (!shop) {
    risks.push({
      type: "shop_unknown",
      severity: "MEDIUM",
      message: "Shop information not available",
      impact: 0.1,
    });
    return risks;
  }
  if (shop.responseRate !== null && shop.responseRate < 50) {
    risks.push({
      type: "low_response_rate",
      severity: shop.responseRate < 30 ? "HIGH" : "MEDIUM",
      message: `Shop response rate is low (${shop.responseRate}%)`,
      impact: 0.15,
    });
  }
  if (shop.rating !== null && shop.rating < 4.0) {
    risks.push({
      type: "low_shop_rating",
      severity: shop.rating < 3.5 ? "HIGH" : "MEDIUM",
      message: `Shop rating is low (${shop.rating}/5)`,
      impact: 0.2,
    });
  }
  return risks;
}

function checkPriceRisks(product: ProductSnapshot): RiskItem[] {
  const risks: RiskItem[] = [];
  if (product.priceMin === null) {
    risks.push({
      type: "price_missing",
      severity: "LOW",
      message: "Price information is missing",
      impact: 0.05,
    });
    return risks;
  }
  if (product.priceBeforeDiscount !== null && product.priceMin < product.priceBeforeDiscount * 0.3) {
    risks.push({
      type: "suspicious_discount",
      severity: "MEDIUM",
      message: "Discount seems unusually large (>70%)",
      impact: 0.3,
    });
  }
  if (product.priceMin > 5000000) {
    risks.push({
      type: "high_price",
      severity: "LOW",
      message: "Product is high-priced (above 5M IDR)",
      impact: 0.1,
    });
  }
  return risks;
}

function checkStockRisks(product: ProductSnapshot): RiskItem[] {
  const risks: RiskItem[] = [];
  if (product.stock !== null && product.stock < 5) {
    risks.push({
      type: "low_stock",
      severity: product.stock === 0 ? "HIGH" : "MEDIUM",
      message: product.stock === 0 ? "Product is out of stock" : `Low stock (${product.stock} units)`,
      impact: 0.1,
    });
  }
  return risks;
}
