import { describe, expect, it } from "vitest";
import {
  registerRequestSchema,
  loginRequestSchema,
  compareLinksRequestSchema,
  keywordSearchRequestSchema,
  resolveUrlRequestSchema,
  aiModelTestRequestSchema,
  apiErrorResponseSchema,
  healthResponseSchema,
  jobStatusResponseSchema,
  resolveUrlResponseSchema,
  resolveUrlResultSchema,
  queueMessageSchema,
  productSnapshotSchema,
  shopSnapshotSchema,
  searchResultCandidateSchema,
  weightExtractionSchema,
  aiReportStructuredSchema,
} from "./index.js";

describe("registerRequestSchema", () => {
  it("accepts valid register request", () => {
    const result = registerRequestSchema.safeParse({
      email: "user@example.com",
      password: "secretPassword",
    });
    expect(result.success).toBe(true);
  });

  it("accepts register request with name", () => {
    const result = registerRequestSchema.safeParse({
      email: "user@example.com",
      password: "secretPassword",
      name: "Jhon",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerRequestSchema.safeParse({
      email: "not-an-email",
      password: "secretPassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerRequestSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginRequestSchema", () => {
  it("accepts valid login request", () => {
    const result = loginRequestSchema.safeParse({
      email: "user@example.com",
      password: "secretPassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginRequestSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("compareLinksRequestSchema", () => {
  it("accepts 1-5 valid URLs", () => {
    const result = compareLinksRequestSchema.safeParse({
      links: ["https://shopee.co.id/product/123/456"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty links array", () => {
    const result = compareLinksRequestSchema.safeParse({
      links: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 links", () => {
    const result = compareLinksRequestSchema.safeParse({
      links: [
        "https://shopee.co.id/a",
        "https://shopee.co.id/b",
        "https://shopee.co.id/c",
        "https://shopee.co.id/d",
        "https://shopee.co.id/e",
        "https://shopee.co.id/f",
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("keywordSearchRequestSchema", () => {
  it("accepts valid keyword search", () => {
    const result = keywordSearchRequestSchema.safeParse({
      keyword: "tensimeter digital",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults", () => {
    const result = keywordSearchSchema.parse({
      keyword: "test",
    });
    expect(result.shippedFrom).toBe("DKI Jakarta");
    expect(result.limit).toBe(10);
  });

  it("rejects empty keyword", () => {
    const result = keywordSearchRequestSchema.safeParse({
      keyword: "",
    });
    expect(result.success).toBe(false);
  });
});

const keywordSearchSchema = keywordSearchRequestSchema;

describe("resolveUrlRequestSchema", () => {
  it("accepts valid URL", () => {
    const result = resolveUrlRequestSchema.safeParse({
      url: "https://id.shp.ee/kf239Muk",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty URL", () => {
    const result = resolveUrlRequestSchema.safeParse({
      url: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("aiModelTestRequestSchema", () => {
  it("accepts valid test request", () => {
    const result = aiModelTestRequestSchema.safeParse({
      testPrompt: "Return JSON only: {\"ok\": true}",
      expectJson: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("apiErrorResponseSchema", () => {
  it("accepts valid error response", () => {
    const result = apiErrorResponseSchema.safeParse({
      error: {
        code: "INVALID_INPUT",
        message: "Input is invalid.",
        details: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid error code", () => {
    const result = apiErrorResponseSchema.safeParse({
      error: {
        code: "NOT_A_CODE",
        message: "test",
        details: null,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("healthResponseSchema", () => {
  it("accepts valid health response", () => {
    const result = healthResponseSchema.safeParse({
      status: "ok",
      appName: "Shopee Product Research AI",
      environment: "development",
    });
    expect(result.success).toBe(true);
  });
});

describe("jobStatusResponseSchema", () => {
  it("accepts valid job status", () => {
    const result = jobStatusResponseSchema.safeParse({
      id: "job_xxx",
      status: "processing",
      progressCurrent: 3,
      progressTotal: 5,
      currentStep: "fetchingProduct",
      errorMessage: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts partialSuccess status", () => {
    const result = jobStatusResponseSchema.safeParse({
      id: "job_xxx",
      status: "partialSuccess",
      progressCurrent: 5,
      progressTotal: 5,
      currentStep: null,
      errorMessage: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = jobStatusResponseSchema.safeParse({
      id: "job_xxx",
      status: "partial_success",
      progressCurrent: 3,
      progressTotal: 5,
      currentStep: null,
      errorMessage: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("resolveUrlResponseSchema", () => {
  it("accepts valid resolved URL", () => {
    const result = resolveUrlResponseSchema.safeParse({
      originalUrl: "https://id.shp.ee/kf239Muk",
      finalUrl: "https://shopee.co.id/product/1494940697/41104660407",
      canonicalUrl: "https://shopee.co.id/product/1494940697/41104660407",
      shopId: "1494940697",
      itemId: "41104660407",
      resolveMethod: "redirect",
      status: "resolved",
    });
    expect(result.success).toBe(true);
  });

  it("accepts failed resolve", () => {
    const result = resolveUrlResponseSchema.safeParse({
      originalUrl: "https://id.shp.ee/bad",
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: null,
      status: "failed",
    });
    expect(result.success).toBe(true);
  });
});

describe("resolveUrlResultSchema", () => {
  it("accepts resolved URL result", () => {
    const result = resolveUrlResultSchema.safeParse({
      originalUrl: "https://id.shp.ee/kf239Muk",
      finalUrl: "https://shopee.co.id/product/1494940697/41104660407",
      canonicalUrl: "https://shopee.co.id/product/1494940697/41104660407",
      shopId: "1494940697",
      itemId: "41104660407",
      resolveMethod: "redirect",
      status: "resolved",
    });
    expect(result.success).toBe(true);
  });

  it("accepts failed URL result with error message", () => {
    const result = resolveUrlResultSchema.safeParse({
      originalUrl: "https://id.shp.ee/bad",
      finalUrl: null,
      canonicalUrl: null,
      shopId: null,
      itemId: null,
      resolveMethod: "webFetch",
      status: "failed",
      errorMessage: "Could not resolve URL",
    });
    expect(result.success).toBe(true);
  });
});

describe("queueMessageSchema", () => {
  it("accepts compare links message", () => {
    const result = queueMessageSchema.safeParse({
      userId: "usr_xxx",
      researchSessionId: "rsr_xxx",
      mode: "compareLinks",
      links: ["https://id.shp.ee/kf239Muk"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyword search message", () => {
    const result = queueMessageSchema.safeParse({
      userId: "usr_xxx",
      researchSessionId: "rsr_xxx",
      mode: "keywordSearch",
      keyword: "tensimeter digital",
      shippedFrom: "DKI Jakarta",
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mode", () => {
    const result = queueMessageSchema.safeParse({
      userId: "usr_xxx",
      researchSessionId: "rsr_xxx",
      mode: "unknown",
    });
    expect(result.success).toBe(false);
  });
});

describe("weightExtractionSchema", () => {
  it("accepts valid weight with value", () => {
    const result = weightExtractionSchema.safeParse({
      value: 500,
      unit: "gram",
      rawText: "Berat: 500g",
      source: "productSpecification",
      confidence: 0.92,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null weight", () => {
    const result = weightExtractionSchema.safeParse({
      value: null,
      unit: null,
      rawText: null,
      source: null,
      confidence: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidence above 1", () => {
    const result = weightExtractionSchema.safeParse({
      value: 500,
      unit: "gram",
      rawText: null,
      source: null,
      confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("productSnapshotSchema", () => {
  it("accepts minimal valid product snapshot", () => {
    const result = productSnapshotSchema.safeParse({
      shopeeItemId: null,
      shopeeShopId: null,
      title: null,
      brand: null,
      category: null,
      originalUrl: null,
      canonicalUrl: null,
      imageUrl: null,
      galleryJson: null,
      videoUrl: null,
      priceMin: null,
      priceMax: null,
      priceBeforeDiscount: null,
      discountText: null,
      rating: null,
      reviewCount: null,
      soldCount: null,
      favoriteCount: null,
      stock: null,
      shippedFrom: null,
      description: null,
      specificationJson: null,
      variationJson: null,
      weight: { value: null, unit: null, rawText: null, source: null, confidence: 0 },
      features: [],
      confidenceScore: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("shopSnapshotSchema", () => {
  it("accepts valid shop snapshot with STARPLUS", () => {
    const result = shopSnapshotSchema.safeParse({
      shopeeShopId: "123",
      name: "Test Shop",
      shopUrl: "https://shopee.co.id/test-shop",
      statusLabels: ["STARPLUS"],
      primaryStatus: "STARPLUS",
      rating: 4.8,
      ratingCount: 1000,
      responseRate: 95,
      responseTime: "dalam beberapa menit",
      followerCount: 5000,
      productCount: 200,
      joinedAgeText: "3 tahun",
      location: "DKI Jakarta",
      confidenceScore: 0.9,
    });
    expect(result.success).toBe(true);
  });

  it("rejects STAR_PLUS as primaryStatus", () => {
    const result = shopSnapshotSchema.safeParse({
      shopeeShopId: "123",
      name: "Test Shop",
      shopUrl: null,
      statusLabels: [],
      primaryStatus: "STAR_PLUS",
      rating: null,
      ratingCount: null,
      responseRate: null,
      responseTime: null,
      followerCount: null,
      productCount: null,
      joinedAgeText: null,
      location: null,
      confidenceScore: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("searchResultCandidateSchema", () => {
  it("accepts valid search candidate", () => {
    const result = searchResultCandidateSchema.safeParse({
      title: "Product Name",
      originalUrl: "https://shopee.co.id/product/1/2",
      canonicalUrl: "https://shopee.co.id/product/1/2",
      itemId: "2",
      shopId: "1",
      priceMin: 50000,
      priceMax: 75000,
      rating: 4.5,
      reviewCount: 100,
      soldCount: 500,
      shippedFrom: "DKI Jakarta",
      shopName: "Test Shop",
      source: "webFetch",
      confidence: 0.8,
    });
    expect(result.success).toBe(true);
  });
});

describe("aiReportStructuredSchema", () => {
  it("accepts valid AI report", () => {
    const result = aiReportStructuredSchema.safeParse({
      bestProductId: "prd_xxx",
      bestProductName: "Best Product",
      ranking: [{ productId: "prd_xxx", rank: 1, reason: "Highest score" }],
      valueForMoneyProductId: "prd_yyy",
      safestProductId: "prd_xxx",
      riskiestProductId: "prd_zzz",
      prosCons: [
        { productId: "prd_xxx", pros: ["Good quality"], cons: ["Expensive"] },
      ],
      redFlags: [{ productId: "prd_zzz", type: "suspiciousPrice", message: "Too cheap" }],
      confidence: 0.85,
      missingDataNotes: ["Weight not available for prd_zzz"],
    });
    expect(result.success).toBe(true);
  });
});
