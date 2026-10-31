export const SESSION_COOKIE_NAME = "b4gone_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

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

export function readSessionSecret(env: Readonly<Record<string, string | undefined>>): Uint8Array {
  void env;
  throw new Error("Not implemented: readSessionSecret");
}

export async function createSessionToken(userId: string, secret: Uint8Array, now?: Date): Promise<string> {
  void userId;
  void secret;
  void now;
  throw new Error("Not implemented: createSessionToken");
}

export async function verifySessionToken(
  token: string,
  secret: Uint8Array,
  now?: Date,
): Promise<{ userId: string } | null> {
  void token;
  void secret;
  void now;
  throw new Error("Not implemented: verifySessionToken");
}

export function sessionCookieOptions(production: boolean): SessionCookieOptions {
  void production;
  throw new Error("Not implemented: sessionCookieOptions");
}
