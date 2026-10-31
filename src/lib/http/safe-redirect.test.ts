import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it.each(["/dashboard", "/items/42", "/subscriptions?view=all"])("keeps the in-site path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    undefined,
    "",
    "dashboard",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/dashboard",
    "javascript:alert(1)",
    "/sign-in",
    "/register",
  ])("falls back to the dashboard for %j", (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("uses the first value when a query parameter repeats", () => {
    expect(safeNextPath(["/items", "//evil.example"])).toBe("/items");
  });
});
