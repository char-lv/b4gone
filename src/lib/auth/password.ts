/** bcrypt ignores input past this many bytes, so longer passwords are rejected instead. */
export const BCRYPT_MAX_BYTES = 72;

export class PasswordTooLongError extends Error {
  constructor() {
    super(`Passwords can be at most ${BCRYPT_MAX_BYTES} bytes.`);
    this.name = "PasswordTooLongError";
  }
}

export async function hashPassword(password: string, rounds?: number): Promise<string> {
  void password;
  void rounds;
  throw new Error("Not implemented: hashPassword");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  void password;
  void hash;
  throw new Error("Not implemented: verifyPassword");
}
