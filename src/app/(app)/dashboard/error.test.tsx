import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardError from "./error";

describe("Dashboard error state", () => {
  it("explains the failure without details and retries on request", async () => {
    const retry = vi.fn();
    render(<DashboardError error={new Error("connect ECONNREFUSED 10.0.0.5:5432")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your dashboard");
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
