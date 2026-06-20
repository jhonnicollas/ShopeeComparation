import { Hono } from "hono";
import { registerRequestSchema, registerResponseSchema, loginRequestSchema, loginResponseSchema, logoutResponseSchema, meResponseSchema } from "@shopee-research/shared";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionTokenAsync,
  getSessionExpiry,
  isSessionExpired,
  isSessionRevoked,
  hashUserAgent,
  hashIp,
  validateAuthInput,
} from "@shopee-research/auth";
import {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  findSessionByTokenHash,
  revokeSession,
} from "@shopee-research/db";
import { invalidJsonResponse, validationErrorResponse, errorResponse, unauthenticatedResponse, conflictResponse } from "../lib/errors.js";

type Bindings = {
  DB: D1Database;
  LOGS: R2Bucket;
  RESEARCH_QUEUE: Queue;
  APP_ENV: string;
  APP_NAME: string;
  PASSWORD_PEPPER?: string;
};

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SAME_SITE_COOKIE = "SameSite=None; Secure";

function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${bytesToBase64Url(bytes)}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function extractSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME && value) {
      return value;
    }
  }
  return null;
}

export const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post("/register", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid registration input", parsed.error.issues);
  }

  const { email, password, name } = parsed.data;
  const validation = validateAuthInput(email, password, name);
  if (!validation.valid) {
    return errorResponse(c, 400, "INVALID_INPUT", validation.error ?? "Invalid input");
  }

  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) {
    return conflictResponse(c, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
  }

  const pepper = c.env.PASSWORD_PEPPER ?? "";
  const { hash, salt } = await hashPassword(password, pepper);

  const userId = generateId("usr");
  const user = await createUser(c.env.DB, {
    id: userId,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    name: name ?? null,
    role: "user",
    status: "active",
  });

  const sessionToken = generateSessionToken();
  const tokenHash = await hashSessionTokenAsync(sessionToken);
  const sessionId = generateId("ses");

  const userAgent = c.req.header("user-agent") ?? "";
  const ip = c.req.header("cf-connecting-ip") ?? "";
  const userAgentHash = userAgent ? await hashUserAgent(userAgent) : null;
  const ipHash = ip ? await hashIp(ip) : null;

  await createSession(c.env.DB, {
    id: sessionId,
    userId: user.id,
    tokenHash,
    userAgentHash,
    ipHash,
    expiresAt: getSessionExpiry(SESSION_DURATION_MS),
  });

  const responseBody = registerResponseSchema.parse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  const isProduction = c.env.APP_ENV === "production";
  const cookieValue = `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${SAME_SITE_COOKIE}; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}${isProduction ? "; Secure" : ""}`;

  c.header("Set-Cookie", cookieValue);
  return c.json(responseBody, 201);
});

authRouter.post("/login", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return invalidJsonResponse(c);
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(c, "Invalid login input", parsed.error.issues);
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(c.env.DB, email);
  if (!user) {
    return errorResponse(c, 401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.status !== "active") {
    return errorResponse(c, 401, "ACCOUNT_DISABLED", "Account is disabled");
  }

  const pepper = c.env.PASSWORD_PEPPER ?? "";
  const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt, pepper);
  if (!isValid) {
    return errorResponse(c, 401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const sessionToken = generateSessionToken();
  const tokenHash = await hashSessionTokenAsync(sessionToken);
  const sessionId = generateId("ses");

  const userAgent = c.req.header("user-agent") ?? "";
  const ip = c.req.header("cf-connecting-ip") ?? "";
  const userAgentHash = userAgent ? await hashUserAgent(userAgent) : null;
  const ipHash = ip ? await hashIp(ip) : null;

  await createSession(c.env.DB, {
    id: sessionId,
    userId: user.id,
    tokenHash,
    userAgentHash,
    ipHash,
    expiresAt: getSessionExpiry(SESSION_DURATION_MS),
  });

  const responseBody = loginResponseSchema.parse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });

  const isProduction = c.env.APP_ENV === "production";
  const cookieValue = `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${SAME_SITE_COOKIE}; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}${isProduction ? "; Secure" : ""}`;

  c.header("Set-Cookie", cookieValue);
  return c.json(responseBody, 200);
});

authRouter.post("/logout", async (c) => {
  const cookieHeader = c.req.header("cookie");
  const sessionToken = extractSessionToken(cookieHeader);
  if (!sessionToken) {
    return unauthenticatedResponse(c, "No session cookie provided");
  }

  const tokenHash = await hashSessionTokenAsync(sessionToken);
  const session = await findSessionByTokenHash(c.env.DB, tokenHash);
  if (!session) {
    const clearCookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; ${SAME_SITE_COOKIE}; Max-Age=0`;
    c.header("Set-Cookie", clearCookie);
    return unauthenticatedResponse(c, "Session not found");
  }

  if (isSessionExpired(session.expiresAt) || isSessionRevoked(session.revokedAt)) {
    const clearCookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; ${SAME_SITE_COOKIE}; Max-Age=0`;
    c.header("Set-Cookie", clearCookie);
    return unauthenticatedResponse(c, "Session is no longer valid");
  }

  await revokeSession(c.env.DB, session.id);

  const clearCookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; ${SAME_SITE_COOKIE}; Max-Age=0`;
  c.header("Set-Cookie", clearCookie);
  return c.json(logoutResponseSchema.parse({ success: true }), 200);
});

authRouter.get("/me", async (c) => {
  const cookieHeader = c.req.header("cookie");
  const sessionToken = extractSessionToken(cookieHeader);
  if (!sessionToken) {
    return unauthenticatedResponse(c, "No session cookie provided");
  }

  const tokenHash = await hashSessionTokenAsync(sessionToken);
  const session = await findSessionByTokenHash(c.env.DB, tokenHash);
  if (!session) {
    return unauthenticatedResponse(c, "Session not found");
  }

  if (isSessionExpired(session.expiresAt) || isSessionRevoked(session.revokedAt)) {
    return unauthenticatedResponse(c, "Session is no longer valid");
  }

  const user = await findUserById(c.env.DB, session.userId);
  if (!user) {
    return unauthenticatedResponse(c, "User not found");
  }

  if (user.status !== "active") {
    return errorResponse(c, 401, "ACCOUNT_DISABLED", "Account is disabled");
  }

  const responseBody = meResponseSchema.parse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  return c.json(responseBody, 200);
});
