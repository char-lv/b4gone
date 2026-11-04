import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewItemPanel } from "./NewItemPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("NewItemPanel", () => {
  beforeEach(() => {
    push.mockClear();
    vi.useFakeTimers({ toFake: ["Date"] });
    // 02:30 UTC on Oct 24 is still Oct 23 in the test time zone (America/New_York).
    vi.setSystemTime(new Date("2026-10-24T02:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("limits the purchase date to the user's local today", () => {
    render(<NewItemPanel />);

    expect(screen.getByRole("heading", { level: 1, name: "Add item" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add item" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Purchase date/)).toHaveAttribute("max", "2026-10-23");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("confirms the submitted item without claiming it was saved to an account", async () => {
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await user.type(screen.getByLabelText(/^Name/), "Wool coat");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-09");
    await user.type(screen.getByLabelText(/^Price/), "189.5");
    await user.type(screen.getByLabelText(/^Warranty expiration/), "2027-10-09");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("“Wool coat” is ready");
    expect(status).toHaveTextContent("Purchased Oct 9, 2026");
    expect(status).toHaveTextContent("$189.50");
    expect(status).toHaveTextContent("Warranty until Oct 9, 2027");
    expect(status).toHaveTextContent("Saving items to your account isn’t available yet.");
  });

  it("describes a blank price as not entered", async () => {
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await user.type(screen.getByLabelText(/^Name/), "Phone case");
    await user.type(screen.getByLabelText(/^Purchase date/), "2026-10-15");
    await user.type(screen.getByLabelText(/^Return deadline/), "2026-11-14");
    await user.click(screen.getByRole("button", { name: "Save item" }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Price not entered");
    expect(status).toHaveTextContent("Return by Nov 14, 2026");
  });

  it("returns home on cancel", async () => {
    const user = userEvent.setup();
    render(<NewItemPanel />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith("/");
  });
});
