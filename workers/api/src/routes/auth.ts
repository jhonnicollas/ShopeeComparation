import { Hono } from "hono";
import { registerRequestSchema, registerResponseSchema } from "@shopee-research/shared";
import {
  hashPassword,
  generateSessionToken,
  hashSessionTokenAsync,
  getSessionExpiry,
  hashUserAgent,
  hashIp,
  validateAuthInput,
} from "@shopee-research/auth";
import {
  createUser,
  findUserByEmail,
  createSession,
} from "@shopee-research/db";

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

export const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post("/register", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Request body must be valid JSON",
          details: null,
        },
      },
      400
    );
  }

  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid registration input",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      400
    );
  }

  const { email, password, name } = parsed.data;
  const validation = validateAuthInput(email, password, name);
  if (!validation.valid) {
    return c.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: validation.error ?? "Invalid input",
          details: null,
        },
      },
      400
    );
  }

  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) {
    return c.json(
      {
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists",
          details: null,
        },
      },
      409
    );
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
  const cookieValue = `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}${isProduction ? "; Secure" : ""}`;

  c.header("Set-Cookie", cookieValue);
  return c.json(responseBody, 201);
});
