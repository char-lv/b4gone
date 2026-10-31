// @vitest-environment node
import { apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "./api-response";

describe("API error responses", () => {
  it("builds the shared error shape with optional field messages", async () => {
    const plain = apiError(400, "invalid_json", "Send the request body as JSON.");
    const withFields = apiError(400, "validation_failed", "Check the highlighted fields.", { email: "Required." });

    expect(plain.status).toBe(400);
    await expect(plain.json()).resolves.toEqual({
      error: { code: "invalid_json", message: "Send the request body as JSON." },
    });
    await expect(withFields.json()).resolves.toEqual({
      error: { code: "validation_failed", message: "Check the highlighted fields.", fields: { email: "Required." } },
    });
  });

  it("has fixed responses for cross-origin and unauthenticated requests", async () => {
    expect(forbiddenOrigin().status).toBe(403);
    expect(unauthenticated().status).toBe(401);
    await expect(unauthenticated().json()).resolves.toEqual({
      error: { code: "unauthenticated", message: "Sign in to continue." },
    });
  });

  it("returns a generic 500 and logs only the error name, never its message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new TypeError("password=hunter2 token=abc");

    const response = serverError("Sign-in", error);
    serverError("Sign-in", "not an Error");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: "server_error", message: "Something went wrong. Please try again." },
    });
    expect(log).toHaveBeenCalledWith("Sign-in failed: TypeError");
    expect(log).toHaveBeenCalledWith("Sign-in failed: unknown error");
    expect(log.mock.calls.flat().join(" ")).not.toContain("hunter2");
    log.mockRestore();
  });
});

describe("readJson", () => {
  it("returns the parsed body, or undefined when it is not JSON", async () => {
    const post = (body: string) => new Request("https://b4gone.example/api", { method: "POST", body });

    await expect(readJson(post('{"a":1}'))).resolves.toEqual({ a: 1 });
    await expect(readJson(post("{nope"))).resolves.toBeUndefined();
    await expect(readJson(post(""))).resolves.toBeUndefined();
  });
});
