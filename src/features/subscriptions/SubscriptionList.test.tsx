import { render, screen, within } from "@testing-library/react";
import type { Subscription } from "./subscription-repository";
import { SubscriptionList } from "./SubscriptionList";

// Today is Oct 23, 2026 in the test time zone (America/New_York).
const NOW = new Date("2026-10-23T16:00:00Z");

const MUSIC: Subscription = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Music plan",
  amountCents: 1099,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-31",
  status: "active",
};
const STORAGE: Subscription = {
  id: "1f0d7a52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Cloud storage",
  amountCents: 1200,
  billingCycle: "yearly",
  firstBillingDate: "2024-10-23",
  status: "active",
};
const VIDEO: Subscription = {
  id: "2a0d7a52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Video plan",
  amountCents: 1599,
  billingCycle: "monthly",
  firstBillingDate: "2026-03-05",
  status: "cancelled",
};

function row(name: string) {
  return within(screen.getByRole("rowheader", { name }).closest("tr") as HTMLElement);
}

describe("SubscriptionList", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an empty state with an action to add the first subscription", () => {
    render(<SubscriptionList subscriptions={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Subscriptions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No subscriptions yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add subscription" })).toHaveAttribute("href", "/subscriptions/new");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows amount, cycle, first billing date, next charge, and status for each subscription", () => {
    render(<SubscriptionList subscriptions={[STORAGE, MUSIC, VIDEO]} />);

    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Service",
      "Amount",
      "Billing cycle",
      "First billing date",
      "Next charge",
      "Status",
    ]);
    expect(row("Music plan").getByRole("link", { name: "Music plan" })).toHaveAttribute("href", `/subscriptions/${MUSIC.id}`);
    expect(row("Music plan").getByText("$10.99")).toBeInTheDocument();
    expect(row("Music plan").getByText("Monthly")).toBeInTheDocument();
    expect(row("Music plan").getByText("Jan 31, 2026")).toBeInTheDocument();
    // The Jan 31 anchor gives Oct 31, eight days from today.
    expect(row("Music plan").getByText("Oct 31, 2026")).toBeInTheDocument();
    expect(row("Music plan").getByText("In 8 days")).toBeInTheDocument();
    expect(row("Music plan").getByText("Active")).toBeInTheDocument();

    expect(row("Cloud storage").getByText("Yearly")).toBeInTheDocument();
    expect(row("Cloud storage").getByText("Oct 23, 2026")).toBeInTheDocument();
    expect(row("Cloud storage").getByText("Due today")).toBeInTheDocument();

    expect(row("Video plan").getByText("Cancelled", { selector: "span" })).toBeInTheDocument();
    expect(row("Video plan").getByText("None while cancelled")).toBeInTheDocument();
  });

  it("summarizes the statuses and averages the cost of active subscriptions only", () => {
    render(<SubscriptionList subscriptions={[STORAGE, MUSIC, VIDEO]} />);

    expect(screen.getByText("3 subscriptions: 2 active, 1 cancelled.")).toBeInTheDocument();
    // $10.99 + $12.00 / 12 = $11.99; the cancelled $15.99 is left out.
    expect(screen.getByText("Average monthly cost of active subscriptions: $11.99")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add subscription" })).toBeInTheDocument();
  });
});
