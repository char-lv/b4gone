// Registration and sign-in rules (issue #2), kept out of the route handlers so they stay thin.
import "server-only";
import type { Pool } from "pg";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Credentials } from "./auth-schema";
import { createUser, findUserByEmail, type User } from "./user-repository";

// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
// Precomputed (bcrypt cost 12, same as stored passwords) so the first unknown email does not also hash.
export const DUMMY_PASSWORD_HASH = "$2b$12$y28/zqegfN3RCZwi6q1sNug1lAZozZzQo4gIYKU4ER5/lq/Pn4AS6";

export async function registerUser(db: Pool, { email, password }: Credentials): Promise<User> {
  return createUser(db, email, await hashPassword(password));
}

/** Returns the user when the credentials match, otherwise null without saying which part was wrong. */
export async function authenticate(db: Pool, { email, password }: Credentials): Promise<User | null> {
  const user = await findUserByEmail(db, email);
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? { id: user.id, email: user.email } : null;
}
