import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from "./safe-redirect";

// Any origin works here: a safe result must resolve to whichever site it is used on.
const SITE = "https://b4gone.example";

describe("safeNextPath", () => {
  it.each(["/", "/dashboard", "/items/42", "/subscriptions?view=all", "/items?sort=date#top", "/items#details"])(
    "keeps the in-site path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    ["/items/../subscriptions?view=all#top", "/subscriptions?view=all#top"],
    ["/./items/42", "/items/42"],
    ["/items/café", "/items/caf%C3%A9"],
  ])("returns the normalized form of %j", (value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });

  it.each([
    undefined,
    "",
    "dashboard",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/\\/evil.example",
    "https://evil.example/dashboard",
    "http:evil.example",
    "//[",
    "javascript:alert(1)",
    "/sign-in",
    "/register",
  ])("falls back to the dashboard for %j", (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  // URL parsing removes tab, CR, and LF, so "/\t/evil.example" would otherwise become "//evil.example".
  it.each([
    "/\t/evil.example",
    "/\r/evil.example",
    "/\n/evil.example",
    "/\r\n/evil.example",
    "/items\t",
    "/items\n?x=1",
    "/\u0000/evil.example",
    "/\u007f/evil.example",
  ])("rejects the control characters in %j", (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects a path that only becomes protocol-relative after normalization", () => {
    expect(safeNextPath("/.//evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it.each(["/./sign-in", "/items/../register", "/sign-in/", "/sign-in?next=/items", "/register#top", "/%2E/sign-in"])(
    "does not send a signed-in user back to an account page through %j",
    (value) => {
      expect(safeNextPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
    },
  );

  it.each([
    "/\t/evil.example",
    "/\n/evil.example",
    "/.//evil.example",
    "/\\evil.example",
    "//evil.example",
    "https://evil.example",
    "/items",
  ])("always returns a destination on this site for %j", (value) => {
    expect(new URL(safeNextPath(value), SITE).origin).toBe(SITE);
  });

  it("uses the first value when a query parameter repeats", () => {
    expect(safeNextPath(["/items", "//evil.example"])).toBe("/items");
    expect(safeNextPath(["/\t/evil.example", "/items"])).toBe(DEFAULT_SIGNED_IN_PATH);
  });
});
