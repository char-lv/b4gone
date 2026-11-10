import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItemError from "./error";

describe("Item details error state", () => {
  it("explains the failure without details, retries on request, and links back to the list", async () => {
    const retry = vi.fn();
    render(<ItemError error={new Error("connect ECONNREFUSED 10.0.0.5:5432")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load this item");
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to items" })).toHaveAttribute("href", "/items");

    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
