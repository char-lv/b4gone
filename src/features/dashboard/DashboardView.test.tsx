import { act, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { DeadlineItem } from "@/features/items/item-deadlines";
import type { BillableSubscription } from "@/features/subscriptions/subscription-calculations";
import { DashboardView } from "./DashboardView";

// Today is Nov 8, 2026 in the test time zone (America/New_York).
const NOW = new Date("2026-11-08T17:00:00Z");

const COAT: DeadlineItem = { id: "coat", name: "Wool coat", returnDeadline: "2026-11-08", warrantyExpiration: "2026-12-08", status: "active" };
const LAMP: DeadlineItem = { id: "lamp", name: "Desk lamp", returnDeadline: "2026-11-15", warrantyExpiration: "2026-11-16", status: "active" };
const OLD: DeadlineItem = { id: "old", name: "Old boots", returnDeadline: "2026-11-07", warrantyExpiration: "2026-12-09", status: "active" };
const RETURNED: DeadlineItem = { id: "back", name: "Returned shirt", returnDeadline: "2026-11-09", warrantyExpiration: null, status: "returned" };
const MUSIC: BillableSubscription = {
  id: "music",
  name: "Music",
  amountCents: 999,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-20",
  status: "active",
};
const CLOUD: BillableSubscription = { ...MUSIC, id: "cloud", name: "Cloud", amountCents: 12000, billingCycle: "yearly", firstBillingDate: "2025-12-01" };
const GYM: BillableSubscription = { ...MUSIC, id: "gym", name: "Gym", amountCents: 5000, status: "cancelled", firstBillingDate: "2026-01-09" };

function summaryValue(term: string): HTMLElement {
  const dt = screen.getByText(term, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

function group(name: RegExp) {
  return screen.getByRole("list", { name });
}

function rows(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole("link")
    .map((link) => link.textContent ?? "");
}

describe("DashboardView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("puts the heading and both add actions at the top", () => {
    render(<DashboardView items={[]} subscriptions={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add item" })[0]).toHaveAttribute("href", "/items/new");
    expect(screen.getAllByRole("link", { name: "Add subscription" })[0]).toHaveAttribute("href", "/subscriptions/new");
  });

  it("shows only two summary cards: the deadline count and the average monthly cost", () => {
    render(<DashboardView items={[COAT, LAMP, OLD, RETURNED]} subscriptions={[MUSIC, CLOUD, GYM]} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Deadlines in the next 30 days",
      "Average monthly subscription cost",
    ]);
    // Coat return (day 0) and warranty (day 30), lamp return (day 7) and warranty (day 8), Music (day 12), Cloud (day 23).
    expect(summaryValue("Deadlines in the next 30 days")).toHaveTextContent(
      "62 within 7 days. Each return, warranty, or renewal date counts once.",
    );
    // $9.99 a month plus $120.00 a year / 12; the cancelled $50.00 plan does not count.
    expect(summaryValue("Average monthly subscription cost")).toHaveTextContent(
      "$19.99Monthly plans plus yearly plans divided by 12. Not a forecast of this month’s charges.",
    );
  });

  it("lists the events once, in order, split into the next 7 days and days 8 to 30", () => {
    render(<DashboardView items={[COAT, LAMP, OLD, RETURNED]} subscriptions={[MUSIC, CLOUD, GYM]} />);

    expect(screen.getByRole("heading", { level: 2, name: "Upcoming deadlines" })).toBeInTheDocument();
    expect(rows(group(/^Within 7 days/))).toEqual([
      "Wool coatReturn deadlineNov 8, 2026Due today",
      "Desk lampReturn deadlineNov 15, 2026In 7 days",
    ]);
    expect(rows(group(/^In 8–30 days/))).toEqual([
      "Desk lampWarranty expirationNov 16, 2026In 8 days",
      "MusicRenewal$9.99 per monthNov 20, 2026In 12 days",
      "CloudRenewal$120.00 per yearDec 1, 2026In 23 days",
      "Wool coatWarranty expirationDec 8, 2026In 30 days",
    ]);
    expect(screen.getByRole("heading", { level: 3, name: "Within 7 days 2 deadlines" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "In 8–30 days 4 deadlines" })).toBeInTheDocument();
  });

  it("opens each event's record", () => {
    render(<DashboardView items={[COAT]} subscriptions={[MUSIC]} />);

    expect(screen.getByRole("link", { name: /^Wool coat.*Due today/ })).toHaveAttribute("href", "/items/coat");
    expect(screen.getByRole("link", { name: /^Music/ })).toHaveAttribute("href", "/subscriptions/music");
  });

  it("marks days 0 to 7 as urgent with text, and later days without the urgent style", () => {
    render(<DashboardView items={[COAT, LAMP]} subscriptions={[]} />);

    expect(screen.getByText("Due today")).toHaveClass("text-urgent");
    expect(screen.getByText("In 7 days")).toHaveClass("text-urgent");
    expect(screen.getByText("In 8 days")).not.toHaveClass("text-urgent");
  });

  it("says when one of the groups is empty", () => {
    render(<DashboardView items={[{ ...LAMP, returnDeadline: null }]} subscriptions={[]} />);

    expect(screen.getByText("Nothing is due in the next 7 days.")).toBeInTheDocument();
    expect(summaryValue("Deadlines in the next 30 days")).toHaveTextContent("1None within 7 days.");
  });

  it("rounds only the final average, and says when no subscription is active", () => {
    const yearly = { ...CLOUD, amountCents: 100 };
    const { unmount } = render(
      <DashboardView items={[]} subscriptions={[{ ...yearly, id: "a" }, { ...yearly, id: "b" }, { ...yearly, id: "c" }]} />,
    );
    expect(summaryValue("Average monthly subscription cost")).toHaveTextContent(/^\$0\.25/);
    unmount();

    render(<DashboardView items={[]} subscriptions={[GYM]} />);
    expect(summaryValue("Average monthly subscription cost")).toHaveTextContent(
      "$0.00No active subscriptions. Cancelled ones aren’t counted.",
    );
  });

  it("shows an empty state with both add actions when nothing is due in the next 30 days", () => {
    render(<DashboardView items={[OLD, RETURNED]} subscriptions={[GYM]} />);

    expect(screen.getByRole("heading", { name: "No deadlines in the next 30 days" })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add item" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Add subscription" })).toHaveLength(2);
    expect(summaryValue("Deadlines in the next 30 days")).toHaveTextContent(/^0None within 7 days\./);
  });

  it("renders no dates on the server, which does not know the user's time zone", () => {
    const html = renderToString(<DashboardView items={[COAT]} subscriptions={[MUSIC]} />);

    expect(html).toContain("Checking dates…");
    expect(html).not.toContain("Nov 8, 2026");
    // The average does not depend on today.
    expect(html).toContain("$9.99");
  });

  it("moves to the new day when the page stays open across local midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    // 23:59 on Nov 7, 2026 in New York.
    vi.setSystemTime(new Date("2026-11-08T04:59:00Z"));
    render(<DashboardView items={[{ ...COAT, returnDeadline: "2026-11-07", warrantyExpiration: "2026-11-08" }]} subscriptions={[]} />);
    expect(rows(group(/^Within 7 days/))).toEqual([
      "Wool coatReturn deadlineNov 7, 2026Due today",
      "Wool coatWarranty expirationNov 8, 2026Due tomorrow",
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    expect(rows(group(/^Within 7 days/))).toEqual(["Wool coatWarranty expirationNov 8, 2026Due today"]);
  });
});
