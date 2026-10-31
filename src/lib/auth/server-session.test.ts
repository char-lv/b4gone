// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, readSessionSecret } from "./session";

const USER = { id: "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21", email: "jane@example.com" };
const SECRET = "unit-test-session-secret-0123456789abcdef";

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  cookieValue: undefined as string | undefined,
}));
vi.mock("@/features/auth/user-repository", () => ({ findUserById: mocks.findUserById }));
vi.mock("@/lib/db/pool", () => ({ getPool: () => ({}) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "b4gone_session" && mocks.cookieValue ? { value: mocks.cookieValue } : undefined),
  }),
}));

const { endSession, getCurrentUser, getRequestUser, startSession, userFromToken } = await import("./server-session");

async function tokenFor(userId: string): Promise<string> {
  return createSessionToken(userId, readSessionSecret({ SESSION_SECRET: SECRET }));
}

describe("server session", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", SECRET);
    mocks.findUserById.mockReset();
    mocks.cookieValue = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null without a token, for an invalid token, and for a non-UUID subject", async () => {
    await expect(userFromToken(undefined)).resolves.toBeNull();
    await expect(userFromToken("not-a-token")).resolves.toBeNull();
    await expect(userFromToken(await tokenFor("not-a-uuid"))).resolves.toBeNull();
    expect(mocks.findUserById).not.toHaveBeenCalled();
  });

  it("looks up the user named by a valid token", async () => {
    mocks.findUserById.mockResolvedValue(USER);

    await expect(userFromToken(await tokenFor(USER.id))).resolves.toEqual(USER);
    expect(mocks.findUserById).toHaveBeenCalledWith({}, USER.id);
  });

  it("reads the session cookie from a route request or from the page's cookies", async () => {
    mocks.findUserById.mockResolvedValue(USER);
    const token = await tokenFor(USER.id);

    const request = new NextRequest("https://b4gone.example/api/auth/me", { headers: { cookie: `b4gone_session=${token}` } });
    await expect(getRequestUser(request)).resolves.toEqual(USER);

    await expect(getCurrentUser()).resolves.toBeNull();
    mocks.cookieValue = token;
    await expect(getCurrentUser()).resolves.toEqual(USER);
  });

  it("sets a Secure cookie only in production and clears it on sign-out", async () => {
    const dev = NextResponse.json({});
    await startSession(dev, USER.id);
    const devCookie = dev.headers.get("set-cookie") ?? "";
    expect(devCookie).toMatch(/^b4gone_session=[^;]+;/);
    for (const attribute of [/; Path=\//, /; Max-Age=604800/, /; HttpOnly/i, /; SameSite=lax/i]) {
      expect(devCookie).toMatch(attribute);
    }
    expect(devCookie).not.toMatch(/; Secure/i);

    vi.stubEnv("NODE_ENV", "production");
    const prod = NextResponse.json({});
    await startSession(prod, USER.id);
    expect(prod.headers.get("set-cookie")).toMatch(/; Secure/i);

    const cleared = NextResponse.json({});
    endSession(cleared);
    expect(cleared.headers.get("set-cookie")).toMatch(/^b4gone_session=; Path=\/; Max-Age=0/);
  });
});
