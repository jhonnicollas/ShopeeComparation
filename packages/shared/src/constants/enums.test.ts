import { describe, expect, it } from "vitest";
import {
  userRole,
  userStatus,
  researchMode,
  jobStatus,
  jobType,
  jobStep,
  errorCode,
  shopStatus,
  resolveMethod,
  resolveStatus,
  configValueType,
  testStatus,
  searchProviderType,
  authType,
  riskSeverity,
  fieldAvailabilityStatus,
  logLevel,
  ownerType,
  idPrefix,
} from "./index.js";

describe("userRole enum", () => {
  it("contains user and admin", () => {
    expect(userRole.user).toBe("user");
    expect(userRole.admin).toBe("admin");
  });
});

describe("userStatus enum", () => {
  it("contains active and disabled", () => {
    expect(userStatus.active).toBe("active");
    expect(userStatus.disabled).toBe("disabled");
  });
});

describe("researchMode enum", () => {
  it("contains compareLinks and keywordSearch", () => {
    expect(researchMode.compareLinks).toBe("compareLinks");
    expect(researchMode.keywordSearch).toBe("keywordSearch");
  });
});

describe("jobStatus enum", () => {
  it("contains all five statuses including partialSuccess", () => {
    expect(jobStatus.pending).toBe("pending");
    expect(jobStatus.processing).toBe("processing");
    expect(jobStatus.completed).toBe("completed");
    expect(jobStatus.failed).toBe("failed");
    expect(jobStatus.partialSuccess).toBe("partialSuccess");
  });

  it("does not contain underscore variants", () => {
    const values = Object.values(jobStatus);
    expect(values).not.toContain("partial_success");
    expect(values).not.toContain("PARTIAL_SUCCESS");
    expect(values).not.toContain("partial success");
  });
});

describe("jobType enum", () => {
  it("contains compareLinks and keywordSearch", () => {
    expect(jobType.compareLinks).toBe("compareLinks");
    expect(jobType.keywordSearch).toBe("keywordSearch");
  });
});

describe("jobStep enum", () => {
  it("contains all 12 steps", () => {
    const steps = Object.values(jobStep);
    expect(steps).toHaveLength(12);
    expect(jobStep.queued).toBe("queued");
    expect(jobStep.resolvingUrl).toBe("resolvingUrl");
    expect(jobStep.scoring).toBe("scoring");
    expect(jobStep.generatingReport).toBe("generatingReport");
    expect(jobStep.completed).toBe("completed");
    expect(jobStep.failed).toBe("failed");
  });
});

describe("errorCode enum", () => {
  it("contains all error codes from docs", () => {
    expect(errorCode.invalidInput).toBe("INVALID_INPUT");
    expect(errorCode.unauthorized).toBe("UNAUTHORIZED");
    expect(errorCode.forbidden).toBe("FORBIDDEN");
    expect(errorCode.shortUrlResolveFailed).toBe("SHORT_URL_RESOLVE_FAILED");
    expect(errorCode.productNotFound).toBe("PRODUCT_NOT_FOUND");
    expect(errorCode.shopNotFound).toBe("SHOP_NOT_FOUND");
    expect(errorCode.weightNotFound).toBe("WEIGHT_NOT_FOUND");
    expect(errorCode.shopeeFetchFailed).toBe("SHOPEE_FETCH_FAILED");
    expect(errorCode.browserRenderFailed).toBe("BROWSER_RENDER_FAILED");
    expect(errorCode.aiReportFailed).toBe("AI_REPORT_FAILED");
    expect(errorCode.partialDataOnly).toBe("PARTIAL_DATA_ONLY");
    expect(errorCode.rateLimited).toBe("RATE_LIMITED");
    expect(errorCode.queueFailed).toBe("QUEUE_FAILED");
    expect(errorCode.configNotFound).toBe("CONFIG_NOT_FOUND");
    expect(errorCode.configTestFailed).toBe("CONFIG_TEST_FAILED");
    expect(errorCode.internalError).toBe("INTERNAL_ERROR");
  });

  it("has 16 error codes total", () => {
    expect(Object.values(errorCode)).toHaveLength(16);
  });
});

describe("shopStatus enum", () => {
  it("contains all statuses including STARPLUS", () => {
    expect(shopStatus.mall).toBe("MALL");
    expect(shopStatus.official).toBe("OFFICIAL");
    expect(shopStatus.star).toBe("STAR");
    expect(shopStatus.starplus).toBe("STARPLUS");
    expect(shopStatus.preferred).toBe("PREFERRED");
    expect(shopStatus.regular).toBe("REGULAR");
    expect(shopStatus.unknown).toBe("UNKNOWN");
  });

  it("does not contain STAR_PLUS variant", () => {
    const values = Object.values(shopStatus);
    expect(values).not.toContain("STAR_PLUS");
  });
});

describe("resolveMethod enum", () => {
  it("contains all methods", () => {
    expect(resolveMethod.direct).toBe("direct");
    expect(resolveMethod.redirect).toBe("redirect");
    expect(resolveMethod.webFetch).toBe("webFetch");
    expect(resolveMethod.browserRun).toBe("browserRun");
    expect(resolveMethod.manual).toBe("manual");
  });
});

describe("resolveStatus enum", () => {
  it("contains resolved and failed", () => {
    expect(resolveStatus.resolved).toBe("resolved");
    expect(resolveStatus.failed).toBe("failed");
  });
});

describe("configValueType enum", () => {
  it("contains all value types", () => {
    expect(configValueType.string).toBe("string");
    expect(configValueType.number).toBe("number");
    expect(configValueType.boolean).toBe("boolean");
    expect(configValueType.json).toBe("json");
  });
});

describe("testStatus enum", () => {
  it("contains success failed and untested", () => {
    expect(testStatus.success).toBe("success");
    expect(testStatus.failed).toBe("failed");
    expect(testStatus.untested).toBe("untested");
  });
});

describe("searchProviderType enum", () => {
  it("contains all provider types", () => {
    expect(searchProviderType.officialApi).toBe("officialApi");
    expect(searchProviderType.webFetch).toBe("webFetch");
    expect(searchProviderType.browserRun).toBe("browserRun");
    expect(searchProviderType.vpsScraper).toBe("vpsScraper");
    expect(searchProviderType.manual).toBe("manual");
  });
});

describe("authType enum", () => {
  it("contains bearer apiKey and none", () => {
    expect(authType.bearer).toBe("bearer");
    expect(authType.apiKey).toBe("apiKey");
    expect(authType.none).toBe("none");
  });
});

describe("riskSeverity enum", () => {
  it("contains LOW MEDIUM HIGH", () => {
    expect(riskSeverity.low).toBe("LOW");
    expect(riskSeverity.medium).toBe("MEDIUM");
    expect(riskSeverity.high).toBe("HIGH");
  });
});

describe("fieldAvailabilityStatus enum", () => {
  it("contains available unavailable and partial", () => {
    expect(fieldAvailabilityStatus.available).toBe("available");
    expect(fieldAvailabilityStatus.unavailable).toBe("unavailable");
    expect(fieldAvailabilityStatus.partial).toBe("partial");
  });
});

describe("logLevel enum", () => {
  it("contains info warn and error", () => {
    expect(logLevel.info).toBe("info");
    expect(logLevel.warn).toBe("warn");
    expect(logLevel.error).toBe("error");
  });
});

describe("ownerType enum", () => {
  it("contains all owner types", () => {
    expect(ownerType.product).toBe("product");
    expect(ownerType.shop).toBe("shop");
    expect(ownerType.weight).toBe("weight");
    expect(ownerType.feature).toBe("feature");
    expect(ownerType.resolver).toBe("resolver");
    expect(ownerType.ai).toBe("ai");
    expect(ownerType.report).toBe("report");
  });
});

describe("idPrefix constants", () => {
  it("contains all entity prefixes", () => {
    expect(idPrefix.user).toBe("usr_");
    expect(idPrefix.session).toBe("ses_");
    expect(idPrefix.researchSession).toBe("rsr_");
    expect(idPrefix.product).toBe("prd_");
    expect(idPrefix.shop).toBe("shp_");
    expect(idPrefix.comparison).toBe("cmp_");
    expect(idPrefix.comparisonItem).toBe("cim_");
    expect(idPrefix.job).toBe("job_");
    expect(idPrefix.jobLog).toBe("log_");
    expect(idPrefix.aiReport).toBe("air_");
    expect(idPrefix.rawSnapshot).toBe("raw_");
    expect(idPrefix.fieldEvidence).toBe("evd_");
    expect(idPrefix.productWeight).toBe("wgt_");
    expect(idPrefix.productFeature).toBe("fea_");
    expect(idPrefix.resolvedUrl).toBe("url_");
    expect(idPrefix.appConfig).toBe("cfg_");
    expect(idPrefix.aiProviderConfig).toBe("aip_");
    expect(idPrefix.aiModelConfig).toBe("aim_");
    expect(idPrefix.searchProviderConfig).toBe("srp_");
    expect(idPrefix.scoringConfig).toBe("sco_");
  });
});
