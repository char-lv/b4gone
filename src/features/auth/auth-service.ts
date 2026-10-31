// Registration and sign-in rules (issue #2), kept out of the route handlers so they stay thin.
import "server-only";
import type { Pool } from "pg";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Credentials } from "./auth-schema";
import { createUser, findUserByEmail, type User } from "./user-repository";

// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
let dummyHash: Promise<string> | undefined;

export async function registerUser(db: Pool, { email, password }: Credentials): Promise<User> {
  return createUser(db, email, await hashPassword(password));
}

/** Returns the user when the credentials match, otherwise null without saying which part was wrong. */
export async function authenticate(db: Pool, { email, password }: Credentials): Promise<User | null> {
  const user = await findUserByEmail(db, email);
  if (!user) {
    dummyHash ??= hashPassword("b4gone-timing-placeholder");
    await verifyPassword(password, await dummyHash);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? { id: user.id, email: user.email } : null;
}
