import type { Context } from "hono";

type ValidationIssue = {
  path: PropertyKey[];
  message: string;
};

type ResponseContext = Pick<Context, "json" | "header">;

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export function errorBody(code: string, message: string, details: unknown = null): ErrorBody {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

export function errorResponse(c: ResponseContext, status: number, code: string, message: string, details: unknown = null) {
  return c.json(errorBody(code, message, details), status as 400 | 401 | 403 | 404 | 409 | 429 | 500);
}

export function invalidJsonResponse(c: ResponseContext) {
  return errorResponse(c, 400, "INVALID_INPUT", "Request body must be valid JSON");
}

export function validationErrorResponse(c: ResponseContext, message: string, issues: ValidationIssue[]) {
  const details = issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message }));
  return errorResponse(c, 400, "INVALID_INPUT", message, details);
}

export function notFoundResponse(c: ResponseContext, code: string, message: string) {
  return errorResponse(c, 404, code, message);
}

export function forbiddenResponse(c: ResponseContext, message = "Access forbidden") {
  return errorResponse(c, 403, "FORBIDDEN", message);
}

export function unauthorizedResponse(c: ResponseContext, message = "Authentication required") {
  return errorResponse(c, 401, "UNAUTHORIZED", message);
}

export function unauthenticatedResponse(c: ResponseContext, message = "No session cookie provided") {
  return errorResponse(c, 401, "UNAUTHENTICATED", message);
}

export function conflictResponse(c: ResponseContext, code: string, message: string) {
  return errorResponse(c, 409, code, message);
}

export function internalErrorResponse(c: ResponseContext) {
  return errorResponse(c, 500, "INTERNAL_ERROR", "An unexpected error occurred");
}

export function rateLimitedResponse(c: ResponseContext, retryAfterSeconds: number) {
  c.header("Retry-After", String(retryAfterSeconds));
  return errorResponse(c, 429, "RATE_LIMITED", "Too many requests");
}

export function sanitizeErrorMessage(msg: string | undefined): string | null {
  if (!msg) return null;
  const SECRET_PATTERNS = [
    /api[_-]?key\s*[:=]\s*\S+/gi,
    /token\s*[:=]\s*\S+/gi,
    /secret\s*[:=]\s*\S+/gi,
    /bearer\s+\S+/gi,
    /authorization\s*[:=]\s*\S+/gi,
  ];
  let sanitized = msg;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  if (sanitized.length > 300) {
    sanitized = sanitized.slice(0, 300) + "...";
  }
  return sanitized;
}
