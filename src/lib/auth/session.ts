// Signed session tokens (issue #2). The JWT lives only in an HttpOnly cookie; its secret comes from
// SESSION_SECRET on the server. Callers pass the environment and clock so tests stay deterministic.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "b4gone_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const ALGORITHM = "HS256";
const MIN_SECRET_LENGTH = 32;

export class SessionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionConfigError";
  }
}

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

/** Reads SESSION_SECRET as key bytes. Errors name the variable but never repeat its value. */
export function readSessionSecret(env: Readonly<Record<string, string | undefined>>): Uint8Array {
  const value = env.SESSION_SECRET?.trim();
  if (!value) {
    throw new SessionConfigError("SESSION_SECRET is not set. Copy .env.example to .env.local and set it.");
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new SessionConfigError(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(userId: string, secret: Uint8Array, now = new Date()): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_MAX_AGE_SECONDS)
    .sign(secret);
}

/** Returns the session's user ID, or null for any invalid, expired, or malformed token. */
export async function verifySessionToken(
  token: string,
  secret: Uint8Array,
  now = new Date(),
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM], currentDate: now });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(production: boolean): SessionCookieOptions {
  return { httpOnly: true, sameSite: "lax", secure: production, path: "/", maxAge: SESSION_MAX_AGE_SECONDS };
}
