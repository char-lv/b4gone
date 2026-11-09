// Parameterized queries for the users table (issue #2). Rows map from snake_case columns to the
// camelCase User type here, at the server boundary.
import "server-only";
import type { Pool } from "pg";

export type User = { id: string; email: string };
type UserWithHash = User & { passwordHash: string };

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailTakenError";
  }
}

const UNIQUE_VIOLATION = "23505";

export async function createUser(db: Pool, email: string, passwordHash: string): Promise<User> {
  try {
    const result = await db.query<User>(
      "insert into users (email, password_hash) values ($1, $2) returning id, email",
      [email, passwordHash],
    );
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) throw new EmailTakenError();
    throw error;
  }
}

export async function findUserByEmail(db: Pool, email: string): Promise<UserWithHash | null> {
  const result = await db.query<UserWithHash>(
    'select id, email, password_hash as "passwordHash" from users where email = $1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(db: Pool, id: string): Promise<User | null> {
  const result = await db.query<User>("select id, email from users where id = $1", [id]);
  return result.rows[0] ?? null;
}
