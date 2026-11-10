import type { DeadlineItem } from "@/features/items/item-deadlines";
import type { BillableSubscription } from "@/features/subscriptions/subscription-calculations";
import { dashboardEvents } from "./dashboard-events";

const TODAY = "2026-11-08";

function item(overrides: Partial<DeadlineItem> & Pick<DeadlineItem, "id">): DeadlineItem {
  return { name: `Item ${overrides.id}`, returnDeadline: null, warrantyExpiration: null, status: "active", ...overrides };
}

function subscription(overrides: Partial<BillableSubscription> & Pick<BillableSubscription, "id">): BillableSubscription {
  return {
    name: `Service ${overrides.id}`,
    amountCents: 999,
    billingCycle: "monthly",
    firstBillingDate: "2026-01-20",
    status: "active",
    ...overrides,
  };
}

function summary(events: ReturnType<typeof dashboardEvents>): string[] {
  return events.map((event) => `${event.date} ${event.type} ${event.name}`);
}

describe("dashboardEvents", () => {
  it("keeps today through day 30 and drops yesterday and day 31", () => {
    const events = dashboardEvents(
      [
        item({ id: "a", name: "Yesterday", returnDeadline: "2026-11-07" }),
        item({ id: "b", name: "Today", returnDeadline: "2026-11-08" }),
        item({ id: "c", name: "Day 7", returnDeadline: "2026-11-15" }),
        item({ id: "d", name: "Day 30", returnDeadline: "2026-12-08" }),
        item({ id: "e", name: "Day 31", returnDeadline: "2026-12-09" }),
      ],
      [],
      TODAY,
    );

    expect(summary(events)).toEqual([
      "2026-11-08 return Today",
      "2026-11-15 return Day 7",
      "2026-12-08 return Day 30",
    ]);
  });

  it("leaves out returned items and cancelled subscriptions", () => {
    const events = dashboardEvents(
      [item({ id: "a", status: "returned", returnDeadline: TODAY, warrantyExpiration: "2026-11-10" })],
      [subscription({ id: "s", status: "cancelled", firstBillingDate: TODAY })],
      TODAY,
    );

    expect(events).toEqual([]);
  });

  it("gives an item both of its deadlines and links them to the item", () => {
    const events = dashboardEvents(
      [item({ id: "coat", name: "Wool coat", returnDeadline: "2026-11-20", warrantyExpiration: "2026-11-10" })],
      [],
      TODAY,
    );

    expect(events).toEqual([
      { type: "warranty", recordId: "coat", href: "/items/coat", name: "Wool coat", date: "2026-11-10" },
      { type: "return", recordId: "coat", href: "/items/coat", name: "Wool coat", date: "2026-11-20" },
    ]);
  });

  it("gives each active subscription one next renewal, linked to the subscription", () => {
    const events = dashboardEvents(
      [],
      [subscription({ id: "music", name: "Music", amountCents: 1099, firstBillingDate: "2026-01-20" })],
      TODAY,
    );

    expect(events).toEqual([
      {
        type: "renewal",
        recordId: "music",
        href: "/subscriptions/music",
        name: "Music",
        date: "2026-11-20",
        amountCents: 1099,
        billingCycle: "monthly",
      },
    ]);
  });

  it("counts a charge due today, a free plan, and a first charge within the window", () => {
    const events = dashboardEvents(
      [],
      [
        subscription({ id: "a", name: "Due today", firstBillingDate: "2026-10-08" }),
        subscription({ id: "b", name: "Free", amountCents: 0, firstBillingDate: "2026-01-12" }),
        subscription({ id: "c", name: "Starts later", firstBillingDate: "2026-12-18" }),
        subscription({ id: "d", name: "Starts in a month", billingCycle: "yearly", firstBillingDate: "2026-12-01" }),
      ],
      TODAY,
    );

    expect(summary(events)).toEqual([
      "2026-11-08 renewal Due today",
      "2026-11-12 renewal Free",
      "2026-12-01 renewal Starts in a month",
    ]);
  });

  it("uses the last day of a short month for a day-31 anchor", () => {
    const events = dashboardEvents([], [subscription({ id: "a", firstBillingDate: "2026-01-31" })], "2027-02-10");

    expect(events.map((event) => event.date)).toEqual(["2027-02-28"]);
  });

  it("sorts by date, then return, warranty, renewal, then name ignoring case, then id", () => {
    const day = "2026-11-12";
    const events = dashboardEvents(
      [
        item({ id: "i2", name: "lamp", warrantyExpiration: day }),
        item({ id: "i1", name: "Desk", warrantyExpiration: day }),
        item({ id: "i3", name: "Zebra rug", returnDeadline: day }),
        item({ id: "i5", name: "Same", returnDeadline: "2026-11-09" }),
        item({ id: "i4", name: "same", returnDeadline: "2026-11-09" }),
      ],
      [subscription({ id: "s1", name: "Apple", firstBillingDate: "2026-10-12" })],
      TODAY,
    );

    expect(events.map((event) => event.recordId)).toEqual(["i4", "i5", "i3", "i1", "i2", "s1"]);
  });
});
