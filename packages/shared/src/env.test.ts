import { describe, expect, it } from "vitest";
import { EnvValidationError, safeValidateEnv, validateEnv } from "./env.js";

describe("validateEnv", () => {
  it("validates a complete valid env object", () => {
    const input = {
      APP_ENV: "development",
      APP_NAME: "Test App",
      APP_BASE_URL: "https://example.com",
      NINEROUTER_BASE_URL: "https://api.test-router.com",
      NINEROUTER_MODEL_PRIMARY: "gpt-4",
      NINEROUTER_MODEL_FAST: "gpt-3.5-turbo",
      NINEROUTER_MODEL_FALLBACK: "claude-3",
      JOB_POLL_INTERVAL_MS: "5000",
      MAX_COMPARE_LINKS: "10",
      KEYWORD_SEARCH_LIMIT: "20",
      DEFAULT_SHIPPED_FROM: "Jakarta",
    };
    const result = validateEnv(input);
    expect(result.env.APP_ENV).toBe("development");
    expect(result.env.APP_NAME).toBe("Test App");
    expect(result.env.APP_BASE_URL).toBe("https://example.com");
    expect(result.env.NINEROUTER_BASE_URL).toBe("https://api.test-router.com");
    expect(result.env.NINEROUTER_MODEL_PRIMARY).toBe("gpt-4");
    expect(result.env.JOB_POLL_INTERVAL_MS).toBe(5000);
    expect(result.env.MAX_COMPARE_LINKS).toBe(10);
    expect(result.env.KEYWORD_SEARCH_LIMIT).toBe(20);
    expect(result.env.DEFAULT_SHIPPED_FROM).toBe("Jakarta");
    expect(result.isDevelopment).toBe(true);
    expect(result.isProduction).toBe(false);
    expect(result.isStaging).toBe(false);
  });

  it("applies default values for missing optional vars", () => {
    const input = {};
    const result = validateEnv(input);
    expect(result.env.APP_ENV).toBe("development");
    expect(result.env.APP_NAME).toBe("Shopee Product Research AI");
    expect(result.env.JOB_POLL_INTERVAL_MS).toBe(3000);
    expect(result.env.MAX_COMPARE_LINKS).toBe(5);
    expect(result.env.KEYWORD_SEARCH_LIMIT).toBe(10);
    expect(result.env.DEFAULT_SHIPPED_FROM).toBe("DKI Jakarta");
  });

  it("accepts empty strings for optional URL vars", () => {
    const input = {
      APP_BASE_URL: "",
      NINEROUTER_BASE_URL: "",
      NINEROUTER_MODEL_PRIMARY: "",
    };
    const result = validateEnv(input);
    expect(result.env.APP_BASE_URL).toBe("");
    expect(result.env.NINEROUTER_BASE_URL).toBe("");
    expect(result.env.NINEROUTER_MODEL_PRIMARY).toBe("");
  });

  it("throws error for invalid APP_ENV value", () => {
    const input = {
      APP_ENV: "invalid",
    };
    expect(() => validateEnv(input)).toThrow(EnvValidationError);
    try {
      validateEnv(input);
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      if (error instanceof EnvValidationError) {
        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.issues[0].path).toBe("APP_ENV");
      }
    }
  });

  it("throws error for invalid URL in APP_BASE_URL", () => {
    const input = {
      APP_BASE_URL: "not a url",
    };
    expect(() => validateEnv(input)).toThrow(EnvValidationError);
  });

  it("throws error for non-numeric JOB_POLL_INTERVAL_MS", () => {
    const input = {
      JOB_POLL_INTERVAL_MS: "not a number",
    };
    expect(() => validateEnv(input)).toThrow(EnvValidationError);
  });

  it("throws error for non-numeric MAX_COMPARE_LINKS", () => {
    const input = {
      MAX_COMPARE_LINKS: "abc",
    };
    expect(() => validateEnv(input)).toThrow(EnvValidationError);
  });

  it("correctly identifies production environment", () => {
    const input = {
      APP_ENV: "production",
    };
    const result = validateEnv(input);
    expect(result.isProduction).toBe(true);
    expect(result.isStaging).toBe(false);
    expect(result.isDevelopment).toBe(false);
  });

  it("correctly identifies staging environment", () => {
    const input = {
      APP_ENV: "staging",
    };
    const result = validateEnv(input);
    expect(result.isStaging).toBe(true);
    expect(result.isProduction).toBe(false);
    expect(result.isDevelopment).toBe(false);
  });

  it("provides clear error message with all issues", () => {
    const input = {
      APP_ENV: "invalid",
      JOB_POLL_INTERVAL_MS: "abc",
    };
    try {
      validateEnv(input);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      if (error instanceof EnvValidationError) {
        expect(error.message).toContain("Environment validation failed");
        expect(error.message).toContain("APP_ENV");
        expect(error.message).toContain("JOB_POLL_INTERVAL_MS");
      }
    }
  });
});

describe("safeValidateEnv", () => {
  it("returns success for valid env", () => {
    const result = safeValidateEnv({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env.APP_ENV).toBe("development");
    }
  });

  it("returns error for invalid env without throwing", () => {
    const result = safeValidateEnv({ APP_ENV: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(EnvValidationError);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
