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
