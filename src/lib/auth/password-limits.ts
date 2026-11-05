// The bcrypt input limit (issue #2), shared by the account forms and the server-only hashing module.
// bcrypt ignores input past this many bytes, so longer passwords are rejected instead of truncated.
export const PASSWORD_MAX_BYTES = 72;

export function fitsPasswordLimit(password: string): boolean {
  return new TextEncoder().encode(password).byteLength <= PASSWORD_MAX_BYTES;
}
