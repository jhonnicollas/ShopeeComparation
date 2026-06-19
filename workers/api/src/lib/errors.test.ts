import { describe, expect, it, vi } from "vitest";
import {
  errorBody,
  invalidJsonResponse,
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
  conflictResponse,
  internalErrorResponse,
  rateLimitedResponse,
  sanitizeErrorMessage,
} from "./errors.js";

type TestContext = {
  json: ReturnType<typeof vi.fn>;
  header: ReturnType<typeof vi.fn>;
  _headers: Record<string, string>;
};

type ValidationIssue = {
  path: Array<string | number>;
  message: string;
};

function makeContext(): TestContext {
  const headers: Record<string, string> = {};
  return {
    json: vi.fn((body: unknown, status?: number) => ({ body, status })),
    header: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    _headers: headers,
  };
}

describe("errors", () => {
  it("errorBody builds standard error shape", () => {
    const body = errorBody("INVALID_INPUT", "bad input", { field: "email" });
    expect(body).toEqual({
      error: { code: "INVALID_INPUT", message: "bad input", details: { field: "email" } },
    });
  });

  it("errorBody defaults details to null", () => {
    const body = errorBody("NOT_FOUND", "missing");
    expect(body.error.details).toBeNull();
  });

  it("invalidJsonResponse returns 400 with INVALID_INPUT", () => {
    const c = makeContext();
    invalidJsonResponse(c);
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON", details: null } },
      400
    );
  });

  it("validationErrorResponse maps Zod issues to details", () => {
    const c = makeContext();
    const issues: ValidationIssue[] = [
      { path: ["email"], message: "Invalid email" },
      { path: ["password"], message: "Too short" },
    ];
    validationErrorResponse(c, "Invalid input", issues);
    expect(c.json).toHaveBeenCalledWith(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid input",
          details: [
            { path: "email", message: "Invalid email" },
            { path: "password", message: "Too short" },
          ],
        },
      },
      400
    );
  });

  it("notFoundResponse returns 404", () => {
    const c = makeContext();
    notFoundResponse(c, "PRODUCT_NOT_FOUND", "Product not found");
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "PRODUCT_NOT_FOUND", message: "Product not found", details: null } },
      404
    );
  });

  it("forbiddenResponse returns 403 with default message", () => {
    const c = makeContext();
    forbiddenResponse(c);
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "FORBIDDEN", message: "Access forbidden", details: null } },
      403
    );
  });

  it("forbiddenResponse accepts custom message", () => {
    const c = makeContext();
    forbiddenResponse(c, "Cannot access this job");
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "FORBIDDEN", message: "Cannot access this job", details: null } },
      403
    );
  });

  it("unauthorizedResponse returns 401", () => {
    const c = makeContext();
    unauthorizedResponse(c);
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "UNAUTHORIZED", message: "Authentication required", details: null } },
      401
    );
  });

  it("conflictResponse returns 409", () => {
    const c = makeContext();
    conflictResponse(c, "EMAIL_ALREADY_EXISTS", "Email exists");
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "EMAIL_ALREADY_EXISTS", message: "Email exists", details: null } },
      409
    );
  });

  it("internalErrorResponse returns 500 INTERNAL_ERROR", () => {
    const c = makeContext();
    internalErrorResponse(c);
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", details: null } },
      500
    );
  });

  it("rateLimitedResponse returns 429 with Retry-After header", () => {
    const c = makeContext();
    rateLimitedResponse(c, 60);
    expect(c.header).toHaveBeenCalledWith("Retry-After", "60");
    expect(c.json).toHaveBeenCalledWith(
      { error: { code: "RATE_LIMITED", message: "Too many requests", details: null } },
      429
    );
  });

  it("sanitizeErrorMessage redacts secrets", () => {
    expect(sanitizeErrorMessage("api_key=abc123 failed")).toBe("[REDACTED] failed");
    expect(sanitizeErrorMessage("token=xyz here")).toBe("[REDACTED] here");
    expect(sanitizeErrorMessage("bearer abc123")).toBe("[REDACTED]");
    expect(sanitizeErrorMessage("Authorization: Bearer secret")).toBe("[REDACTED]");
  });

  it("sanitizeErrorMessage truncates long messages", () => {
    const long = "x".repeat(400);
    const result = sanitizeErrorMessage(long);
    expect(result!.length).toBe(303);
    expect(result!.endsWith("...")).toBe(true);
  });

  it("sanitizeErrorMessage returns null for empty", () => {
    expect(sanitizeErrorMessage(undefined)).toBeNull();
    expect(sanitizeErrorMessage("")).toBeNull();
  });
});
