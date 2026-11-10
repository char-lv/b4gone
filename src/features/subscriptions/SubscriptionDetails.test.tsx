import { render, screen } from "@testing-library/react";
import type { Subscription } from "./subscription-repository";
import { SubscriptionDetails } from "./SubscriptionDetails";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

// Today is Feb 1, 2026 in the test time zone (America/New_York).
const NOW = new Date("2026-02-01T17:00:00Z");
const MUSIC: Subscription = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Music plan",
  amountCents: 0,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-31",
  status: "active",
};

function value(term: string): string | null | undefined {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

describe("SubscriptionDetails", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the saved fields, the next charge from the original anchor, and the status", () => {
    render(<SubscriptionDetails subscription={MUSIC} saved={false} />);

    expect(screen.getByRole("link", { name: "Back to subscriptions" })).toHaveAttribute("href", "/subscriptions");
    expect(screen.getByRole("heading", { level: 1, name: "Music plan" })).toBeInTheDocument();
    expect(value("Amount")).toBe("$0.00");
    expect(value("Billing cycle")).toBe("Monthly");
    expect(value("First billing date")).toBe("Jan 31, 2026");
    // Feb 28 in 2026, from the Jan 31 anchor.
    expect(value("Next charge")).toBe("Feb 28, 2026In 27 days");
    expect(value("Status")).toBe("Active");
    expect(screen.getByRole("button", { name: "Cancel subscription" })).toBeInTheDocument();
  });

  it("shows no next charge for a cancelled subscription", () => {
    render(<SubscriptionDetails subscription={{ ...MUSIC, status: "cancelled" }} saved={false} />);

    expect(value("Next charge")).toBe("None while cancelled");
    expect(value("Status")).toBe("Cancelled");
  });
});
