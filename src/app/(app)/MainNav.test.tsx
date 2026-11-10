import { render, screen } from "@testing-library/react";
import { MainNav } from "./MainNav";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

describe("MainNav", () => {
  it.each([
    ["/dashboard", "Dashboard"],
    ["/items", "Items"],
    ["/items/new", "Items"],
    ["/items/9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c", "Items"],
    ["/subscriptions", "Subscriptions"],
    ["/subscriptions/9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c/edit", "Subscriptions"],
  ])("marks the current section on %s", (pathname, current) => {
    navigation.pathname = pathname;
    render(<MainNav />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toBeInTheDocument();
    for (const name of ["Dashboard", "Items", "Subscriptions"]) {
      const link = screen.getByRole("link", { name });
      if (name === current) expect(link).toHaveAttribute("aria-current", "page");
      else expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("links to each section", () => {
    render(<MainNav />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Items" })).toHaveAttribute("href", "/items");
    expect(screen.getByRole("link", { name: "Subscriptions" })).toHaveAttribute("href", "/subscriptions");
  });

  it("does not mark Items for a path that only starts with the same letters", () => {
    navigation.pathname = "/itemsearch";
    render(<MainNav />);

    expect(screen.getByRole("link", { name: "Items" })).not.toHaveAttribute("aria-current");
  });
});
