// @vitest-environment node
import { NextRequest } from "next/server";
import { createSessionToken, readSessionSecret } from "@/lib/auth/session";
import { config, proxy } from "./proxy";

const SECRET = "proxy-test-session-secret-0123456789abcdef";
const USER_ID = "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21";

function requestFor(path: string, cookie?: string): NextRequest {
  return new NextRequest(`https://b4gone.example${path}`, { headers: cookie ? { cookie } : {} });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("only runs on private pages", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*", "/items/:path*", "/subscriptions/:path*"]);
  });

  it("sends a signed-out visitor to sign-in and remembers where they were going", async () => {
    const response = await proxy(requestFor("/items/42?tab=details"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://b4gone.example/sign-in?next=%2Fitems%2F42%3Ftab%3Ddetails",
    );
  });

  it("lets a request with a valid session through", async () => {
    const token = await createSessionToken(USER_ID, readSessionSecret(process.env));

    const response = await proxy(requestFor("/dashboard", `b4gone_session=${token}`));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("treats an invalid token like no session", async () => {
    const response = await proxy(requestFor("/dashboard", "b4gone_session=forged"));

    expect(response.headers.get("location")).toBe("https://b4gone.example/sign-in?next=%2Fdashboard");
  });

  it("treats a missing SESSION_SECRET like no session instead of failing the page", async () => {
    const token = await createSessionToken(USER_ID, readSessionSecret(process.env));
    vi.stubEnv("SESSION_SECRET", "");

    const response = await proxy(requestFor("/dashboard", `b4gone_session=${token}`));

    expect(response.headers.get("location")).toBe("https://b4gone.example/sign-in?next=%2Fdashboard");
  });
});
