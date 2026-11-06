import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppError from "./error";

// Errors from a layout, such as the signed-in user lookup while the database is down, reach this page.
describe("Application error state", () => {
  it("explains the failure without details, retries on request, and links home", async () => {
    const retry = vi.fn();
    render(<AppError error={new Error("connect ECONNREFUSED 10.0.0.5:5432")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");

    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
