import type { UserRow } from "@shopee-research/shared";

export interface CreateUserInput {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string | null;
  role: string;
  status: string;
}

export async function findUserByEmail(
  db: D1Database,
  email: string
): Promise<UserRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_users WHERE email = ?")
    .bind(email.toLowerCase())
    .first<UserRow>();
  return result ?? null;
}

export async function findUserById(
  db: D1Database,
  id: string
): Promise<UserRow | null> {
  const result = await db
    .prepare("SELECT * FROM sh_users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  return result ?? null;
}

export async function createUser(
  db: D1Database,
  input: CreateUserInput
): Promise<UserRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sh_users (id, email, passwordHash, passwordSalt, name, role, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.email.toLowerCase(),
      input.passwordHash,
      input.passwordSalt,
      input.name,
      input.role,
      input.status,
      now,
      now
    )
    .run();
  const user = await findUserById(db, input.id);
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

export async function updateUserPassword(
  db: D1Database,
  userId: string,
  passwordHash: string,
  passwordSalt: string
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE sh_users SET passwordHash = ?, passwordSalt = ?, updatedAt = ? WHERE id = ?"
    )
    .bind(passwordHash, passwordSalt, now, userId)
    .run();
}

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
  researchSessionCount: number;
}

export async function listAllUsers(db: D1Database): Promise<AdminUserListItem[]> {
  const usersResult = await db
    .prepare("SELECT * FROM sh_users ORDER BY createdAt DESC")
    .all<UserRow>();
  const items: AdminUserListItem[] = [];
  for (const u of usersResult.results ?? []) {
    const [sessCount, rsCount] = await Promise.all([
      db
        .prepare("SELECT COUNT(*) as n FROM sh_sessions WHERE userId = ? AND revokedAt IS NULL")
        .bind(u.id)
        .first<{ n: number }>(),
      db
        .prepare("SELECT COUNT(*) as n FROM sh_researchSessions WHERE userId = ?")
        .bind(u.id)
        .first<{ n: number }>(),
    ]);
    items.push({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      activeSessionCount: sessCount?.n ?? 0,
      researchSessionCount: rsCount?.n ?? 0,
    });
  }
  return items;
}

export async function setUserStatus(
  db: D1Database,
  userId: string,
  status: "active" | "disabled"
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE sh_users SET status = ?, updatedAt = ? WHERE id = ?")
    .bind(status, now, userId)
    .run();
}
