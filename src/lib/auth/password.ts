// Password hashing with bcryptjs (issue #2). bcrypt silently ignores input past 72 bytes, so longer
// passwords are rejected rather than truncated (AGENTS.md security rules).
import "server-only";
import bcrypt from "bcryptjs";
import { PASSWORD_MAX_BYTES, fitsPasswordLimit } from "./password-limits";

const DEFAULT_ROUNDS = 12;

export class PasswordTooLongError extends Error {
  constructor() {
    super(`Passwords can be at most ${PASSWORD_MAX_BYTES} bytes.`);
    this.name = "PasswordTooLongError";
  }
}

export async function hashPassword(password: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  if (!fitsPasswordLimit(password)) throw new PasswordTooLongError();
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!fitsPasswordLimit(password)) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
