// @vitest-environment node
import { isSameOriginRequest } from "./origin";

const URL_ON_SITE = "https://b4gone.example/api/auth/login";

function request(headers: Record<string, string>): Request {
  return new Request(URL_ON_SITE, { method: "POST", headers });
}

describe("isSameOriginRequest", () => {
  it("accepts a browser request from the same origin", () => {
    expect(isSameOriginRequest(request({ origin: "https://b4gone.example", "sec-fetch-site": "same-origin" }))).toBe(
      true,
    );
  });

  it.each([
    "https://evil.example",
    "https://sub.b4gone.example",
    "http://b4gone.example",
    "https://b4gone.example:8443",
    "null",
  ])("rejects the Origin %s", (origin) => {
    expect(isSameOriginRequest(request({ origin }))).toBe(false);
  });

  it("falls back to Sec-Fetch-Site when the Origin header is missing", () => {
    expect(isSameOriginRequest(request({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "none" }))).toBe(true);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "same-site" }))).toBe(false);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "cross-site" }))).toBe(false);
  });

  it("compares against the host the browser used, not the server's internal URL", () => {
    // `next start` reports request.url as localhost even when the browser opened 127.0.0.1.
    const local = new Request("http://localhost:3100/api/auth/login", {
      method: "POST",
      headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
    });
    // Vercel forwards the public host and protocol.
    const hosted = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "b4gone.vercel.app",
        "x-forwarded-proto": "https",
        origin: "https://b4gone.vercel.app",
      },
    });
    const forged = new Request("http://localhost:3100/api/auth/login", {
      method: "POST",
      headers: { host: "127.0.0.1:3100", origin: "http://localhost:3100" },
    });

    expect(isSameOriginRequest(local)).toBe(true);
    expect(isSameOriginRequest(hosted)).toBe(true);
    expect(isSameOriginRequest(forged)).toBe(false);
  });

  it("accepts a non-browser client that sends neither header", () => {
    expect(isSameOriginRequest(request({}))).toBe(true);
  });
});
