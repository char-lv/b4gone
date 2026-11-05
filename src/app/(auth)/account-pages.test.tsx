import { render, screen } from "@testing-library/react";
import RegisterPage from "./register/page";
import SignInPage from "./sign-in/page";

const session = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/server-session", () => session);

// redirect() throws inside Next.js, so the mock throws too and the page stops rendering.
const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/navigation", () => navigation);

const PAGES = [
  { name: "sign-in", Page: SignInPage, otherLink: "Create an account", otherPath: "/register" },
  { name: "register", Page: RegisterPage, otherLink: "Sign in", otherPath: "/sign-in" },
] as const;

function props(next: string | string[] | undefined) {
  return { searchParams: Promise.resolve({ next }) };
}

beforeEach(() => {
  navigation.redirect.mockClear();
});

describe.each(PAGES)("the $name page", ({ Page, otherLink, otherPath }) => {
  describe("for a user who is already signed in", () => {
    beforeEach(() => {
      session.getCurrentUser.mockResolvedValue({ id: "u1", email: "jane@example.com" });
    });

    it.each([
      ["/\t/evil.example", "/dashboard"],
      ["/\r/evil.example", "/dashboard"],
      ["/\n/evil.example", "/dashboard"],
      ["//evil.example", "/dashboard"],
      ["/\\evil.example", "/dashboard"],
      ["https://evil.example", "/dashboard"],
      ["/./sign-in", "/dashboard"],
      ["/items/../subscriptions?view=all#top", "/subscriptions?view=all#top"],
      ["/items?sort=date", "/items?sort=date"],
    ])("redirects next=%j to %j", async (next, expected) => {
      await expect(Page(props(next))).rejects.toThrow(`redirect:${expected}`);
      expect(navigation.redirect).toHaveBeenCalledWith(expected);
    });
  });

  describe("for a visitor", () => {
    beforeEach(() => {
      session.getCurrentUser.mockResolvedValue(null);
    });

    it("links to the other account page with only a safe destination", async () => {
      render(await Page(props("/\t/evil.example")));

      expect(navigation.redirect).not.toHaveBeenCalled();
      expect(screen.getByRole("link", { name: otherLink })).toHaveAttribute(
        "href",
        `${otherPath}?next=${encodeURIComponent("/dashboard")}`,
      );
    });

    it("keeps a safe destination in the link to the other account page", async () => {
      render(await Page(props("/items?sort=date")));

      expect(screen.getByRole("link", { name: otherLink })).toHaveAttribute(
        "href",
        `${otherPath}?next=${encodeURIComponent("/items?sort=date")}`,
      );
    });
  });
});
