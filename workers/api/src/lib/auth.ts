import { hashSessionTokenAsync, isSessionExpired, isSessionRevoked } from "@shopee-research/auth";
import { findSessionByTokenHash, findUserById } from "@shopee-research/db";

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

export type AuthResult =
  | { authenticated: true; user: AuthContext }
  | { authenticated: false; status: number; code: string; message: string };

export async function authenticate(
  db: D1Database,
  cookieHeader: string | undefined
): Promise<AuthResult> {
  if (!cookieHeader) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "No session cookie provided",
    };
  }

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  let sessionToken: string | null = null;
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "session_token" && value) {
      sessionToken = value;
      break;
    }
  }
  if (!sessionToken) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "No session cookie provided",
    };
  }

  const tokenHash = await hashSessionTokenAsync(sessionToken);
  const session = await findSessionByTokenHash(db, tokenHash);
  if (!session) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Session not found",
    };
  }

  if (isSessionExpired(session.expiresAt) || isSessionRevoked(session.revokedAt)) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Session is no longer valid",
    };
  }

  const user = await findUserById(db, session.userId);
  if (!user) {
    return {
      authenticated: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "User not found",
    };
  }

  if (user.status !== "active") {
    return {
      authenticated: false,
      status: 401,
      code: "ACCOUNT_DISABLED",
      message: "Account is disabled",
    };
  }

  return {
    authenticated: true,
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export function requireAdmin(auth: AuthResult): AuthResult {
  if (!auth.authenticated) {
    return auth;
  }
  if (auth.user.role !== "admin") {
    return {
      authenticated: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Admin role required",
    };
  }
  return auth;
}

export function authErrorResponse(auth: AuthResult): {
  status: number;
  body: { error: { code: string; message: string; details: unknown } };
} {
  if (auth.authenticated) {
    throw new Error("Cannot create error response for authenticated user");
  }
  return {
    status: auth.status,
    body: {
      error: {
        code: auth.code,
        message: auth.message,
        details: null,
      },
    },
  };
}
