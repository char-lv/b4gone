// Password hashing with bcryptjs (issue #2). bcrypt silently ignores input past 72 bytes, so longer
// passwords are rejected rather than truncated (AGENTS.md security rules).
import "server-only";
import bcrypt from "bcryptjs";

/** bcrypt ignores input past this many bytes, so longer passwords are rejected instead. */
export const BCRYPT_MAX_BYTES = 72;

const DEFAULT_ROUNDS = 12;

export class PasswordTooLongError extends Error {
  constructor() {
    super(`Passwords can be at most ${BCRYPT_MAX_BYTES} bytes.`);
    this.name = "PasswordTooLongError";
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export async function hashPassword(password: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  if (byteLength(password) > BCRYPT_MAX_BYTES) throw new PasswordTooLongError();
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (byteLength(password) > BCRYPT_MAX_BYTES) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
