import { render, screen } from "@testing-library/react";
import HomePage from "./page";

const session = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/server-session", () => session);

describe("HomePage", () => {
  it("introduces B4Gone and invites a signed-out visitor to sign in or register", async () => {
    session.getCurrentUser.mockResolvedValue(null);

    render(await HomePage());

    expect(screen.getByRole("heading", { level: 1, name: /keep track of deadlines/i })).toBeInTheDocument();
    for (const topic of ["Return deadlines", "Warranty expirations", "Subscription renewals"]) {
      expect(screen.getByRole("heading", { level: 2, name: topic })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "/sign-in");
    expect(screen.getAllByRole("link", { name: "Create account" })[0]).toHaveAttribute("href", "/register");
  });

  it("links a signed-in user straight to the dashboard", async () => {
    session.getCurrentUser.mockResolvedValue({ id: "u1", email: "jane@example.com" });

    render(await HomePage());

    expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("still renders for visitors when the session cannot be checked", async () => {
    session.getCurrentUser.mockRejectedValue(new Error("database unavailable"));

    render(await HomePage());

    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
  });
});
