// @vitest-environment node
import { SignJWT } from "jose";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionConfigError,
  createSessionToken,
  readSessionSecret,
  sessionCookieOptions,
  verifySessionToken,
} from "./session";

const SECRET_TEXT = "test-only-session-secret-0123456789abcdef";
const OTHER_SECRET_TEXT = "another-test-session-secret-0123456789abc";
const USER_ID = "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21";
const NOW = new Date("2026-10-30T12:00:00Z");

function key(text = SECRET_TEXT): Uint8Array {
  return readSessionSecret({ SESSION_SECRET: text });
}

describe("readSessionSecret", () => {
  it("explains how to set a missing secret", () => {
    expect(() => readSessionSecret({})).toThrow(
      new SessionConfigError("SESSION_SECRET is not set. Copy .env.example to .env.local and set it."),
    );
    expect(() => readSessionSecret({ SESSION_SECRET: "   " })).toThrow(SessionConfigError);
  });

  it("rejects a secret shorter than 32 characters without printing it", () => {
    const short = "too-short-secret";

    expect(() => readSessionSecret({ SESSION_SECRET: short })).toThrow(/at least 32 characters/);
    try {
      readSessionSecret({ SESSION_SECRET: short });
    } catch (error) {
      expect(String(error)).not.toContain(short);
    }
  });

  it("returns the secret as key bytes", () => {
    const secret = key();

    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.byteLength).toBe(SECRET_TEXT.length);
  });
});

describe("session tokens", () => {
  it("round-trips the user ID", async () => {
    const token = await createSessionToken(USER_ID, key(), NOW);

    await expect(verifySessionToken(token, key(), NOW)).resolves.toEqual({ userId: USER_ID });
  });

  it("is still valid just before it expires and invalid after", async () => {
    const token = await createSessionToken(USER_ID, key(), NOW);
    const almost = new Date(NOW.getTime() + (SESSION_MAX_AGE_SECONDS - 1) * 1000);
    const after = new Date(NOW.getTime() + (SESSION_MAX_AGE_SECONDS + 1) * 1000);

    await expect(verifySessionToken(token, key(), almost)).resolves.toEqual({ userId: USER_ID });
    await expect(verifySessionToken(token, key(), after)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(USER_ID, key(OTHER_SECRET_TEXT), NOW);

    await expect(verifySessionToken(token, key(), NOW)).resolves.toBeNull();
  });

  it("rejects a token whose payload was changed", async () => {
    const token = await createSessionToken(USER_ID, key(), NOW);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "someone-else", exp: 4_102_444_800 })).toString(
      "base64url",
    );

    await expect(verifySessionToken(`${header}.${forgedPayload}.${signature}`, key(), NOW)).resolves.toBeNull();
  });

  it("rejects an unsigned token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: USER_ID, exp: 4_102_444_800 })).toString("base64url");

    await expect(verifySessionToken(`${header}.${payload}.`, key(), NOW)).resolves.toBeNull();
  });

  it("rejects a signed token without a user ID", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(NOW)
      .setExpirationTime(new Date(NOW.getTime() + 60_000))
      .sign(key());

    await expect(verifySessionToken(token, key(), NOW)).resolves.toBeNull();
  });

  it.each(["", "not-a-token", "a.b.c"])("rejects the malformed value %j", async (value) => {
    await expect(verifySessionToken(value, key(), NOW)).resolves.toBeNull();
  });
});

describe("sessionCookieOptions", () => {
  it("uses an HttpOnly, SameSite=Lax cookie that lasts as long as the token", () => {
    expect(SESSION_COOKIE_NAME).toBe("b4gone_session");
    expect(sessionCookieOptions(false)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });

  it("marks the cookie Secure in production", () => {
    expect(sessionCookieOptions(true).secure).toBe(true);
  });
});
