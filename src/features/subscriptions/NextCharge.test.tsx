import { act, render, screen } from "@testing-library/react";
import { NextCharge } from "./NextCharge";
import type { Subscription } from "./subscription-repository";

// Written after NextCharge (issue #7): a page left open across local midnight must move the next
// charge and its label to the new day without a reload. The test time zone is America/New_York.
const MUSIC: Subscription = {
  id: "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c",
  name: "Music plan",
  amountCents: 1099,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-30",
  status: "active",
};

describe("NextCharge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the local date past midnight while the page stays open", () => {
    vi.useFakeTimers();
    // 23:59:50 on Oct 29 in New York.
    vi.setSystemTime(new Date("2026-10-30T03:59:50Z"));
    render(<NextCharge subscription={MUSIC} />);
    expect(screen.getByText("Oct 30, 2026")).toBeInTheDocument();
    expect(screen.getByText("Due tomorrow")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("Oct 30, 2026")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("moves to the next month's anchor once today's charge has passed", () => {
    vi.useFakeTimers();
    // 23:59:50 on Oct 30 in New York: the Oct 30 charge is today until midnight.
    vi.setSystemTime(new Date("2026-10-31T03:59:50Z"));
    render(<NextCharge subscription={MUSIC} />);
    expect(screen.getByText("Due today")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // The Jan 30 anchor gives Nov 30, not a date carried over from a short month.
    expect(screen.getByText("Nov 30, 2026")).toBeInTheDocument();
    expect(screen.getByText("In 30 days")).toBeInTheDocument();
  });

  it("shows no next charge for a cancelled subscription", () => {
    render(<NextCharge subscription={{ ...MUSIC, status: "cancelled" }} />);

    expect(screen.getByText("None while cancelled")).toBeInTheDocument();
  });
});
