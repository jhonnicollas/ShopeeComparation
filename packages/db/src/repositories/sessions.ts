import type { SessionRow } from "@shopee-research/shared";

export interface CreateSessionInput {
  id: string;
  userId: string;
  tokenHash: string;
  userAgentHash: string | null;
  ipHash: string | null;
  expiresAt: string;
}

export async function findSessionByTokenHash(
  db: D1Database,
  tokenHash: string
): Promise<SessionRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_sessions WHERE tokenHash = ?")
    .bind(tokenHash)
    .first<SessionRow>();
  return result ?? null;
}

export async function createSession(
  db: D1Database,
  input: CreateSessionInput
): Promise<SessionRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_sessions (id, userId, tokenHash, userAgentHash, ipHash, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.userId,
      input.tokenHash,
      input.userAgentHash,
      input.ipHash,
      input.expiresAt,
      now
    )
    .run();
  const result = await db
    .prepare("SELECT * FROM sh_sessions WHERE id = ?")
    .bind(input.id)
    .first<SessionRow>();
  if (!result) {
    throw new Error("Failed to create session");
  }
  return result;
}

export async function revokeSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE sh_sessions SET revokedAt = ? WHERE id = ?")
    .bind(now, sessionId)
    .run();
}

export async function revokeAllUserSessions(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE sh_sessions SET revokedAt = ? WHERE userId = ? AND revokedAt IS NULL")
    .bind(now, userId)
    .run();
}

export async function deleteExpiredSessions(db: D1Database): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("DELETE FROM sh_sessions WHERE expiresAt < ?")
    .bind(now)
    .run();
}
