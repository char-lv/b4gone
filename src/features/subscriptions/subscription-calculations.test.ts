import { averageMonthlyCostCents, nextRenewals, type BillableSubscription } from "./subscription-calculations";

const TODAY = "2026-11-05";

function subscription(overrides: Partial<BillableSubscription> & Pick<BillableSubscription, "id">): BillableSubscription {
  return {
    name: `Service ${overrides.id}`,
    amountCents: 1000,
    billingCycle: "monthly",
    firstBillingDate: "2026-01-15",
    status: "active",
    ...overrides,
  };
}

describe("nextRenewals", () => {
  it("returns exactly one next renewal for each active subscription", () => {
    const renewals = nextRenewals(
      [
        subscription({ id: "a", name: "Music", firstBillingDate: "2026-01-31", amountCents: 1099 }),
        subscription({ id: "b", name: "Cloud", billingCycle: "yearly", firstBillingDate: "2024-02-29", amountCents: 9999 }),
      ],
      TODAY,
    );

    expect(renewals).toEqual([
      { subscriptionId: "a", name: "Music", date: "2026-11-30", amountCents: 1099 },
      { subscriptionId: "b", name: "Cloud", date: "2027-02-28", amountCents: 9999 },
    ]);
  });

  it("includes a renewal due today and a future first billing date", () => {
    const renewals = nextRenewals(
      [
        subscription({ id: "today", firstBillingDate: "2026-10-05" }),
        subscription({ id: "future", firstBillingDate: "2027-03-01" }),
      ],
      TODAY,
    );

    expect(renewals.map((renewal) => renewal.date)).toEqual(["2026-11-05", "2027-03-01"]);
  });

  it("leaves out cancelled subscriptions", () => {
    const renewals = nextRenewals(
      [subscription({ id: "kept" }), subscription({ id: "gone", status: "cancelled", firstBillingDate: "2026-11-05" })],
      TODAY,
    );

    expect(renewals.map((renewal) => renewal.subscriptionId)).toEqual(["kept"]);
  });

  it("recalculates a reactivated subscription from its original anchor", () => {
    const reactivated = subscription({ id: "back", firstBillingDate: "2026-01-31", status: "active" });

    expect(nextRenewals([reactivated], "2027-02-10")[0].date).toBe("2027-02-28");
    expect(nextRenewals([reactivated], "2027-03-01")[0].date).toBe("2027-03-31");
  });

  it("keeps a free subscription's renewal reminder", () => {
    expect(nextRenewals([subscription({ id: "free", amountCents: 0 })], TODAY)).toHaveLength(1);
  });

  it("returns no renewals for no subscriptions", () => {
    expect(nextRenewals([], TODAY)).toEqual([]);
  });
});

describe("averageMonthlyCostCents", () => {
  it("is zero with no subscriptions or only cancelled ones", () => {
    expect(averageMonthlyCostCents([])).toBe(0);
    expect(averageMonthlyCostCents([subscription({ id: "c", status: "cancelled", amountCents: 5000 })])).toBe(0);
  });

  it("adds active monthly amounts in full", () => {
    expect(
      averageMonthlyCostCents([subscription({ id: "a", amountCents: 1099 }), subscription({ id: "b", amountCents: 1500 })]),
    ).toBe(2599);
  });

  it("adds one twelfth of each active yearly amount", () => {
    expect(averageMonthlyCostCents([subscription({ id: "y", billingCycle: "yearly", amountCents: 12000 })])).toBe(1000);
  });

  it("leaves out cancelled subscriptions of either cycle", () => {
    const subscriptions = [
      subscription({ id: "m", amountCents: 1000 }),
      subscription({ id: "m-off", amountCents: 700, status: "cancelled" }),
      subscription({ id: "y-off", amountCents: 12000, billingCycle: "yearly", status: "cancelled" }),
    ];

    expect(averageMonthlyCostCents(subscriptions)).toBe(1000);
  });

  it("counts zero amounts as zero", () => {
    expect(
      averageMonthlyCostCents([
        subscription({ id: "free-m", amountCents: 0 }),
        subscription({ id: "free-y", amountCents: 0, billingCycle: "yearly" }),
      ]),
    ).toBe(0);
  });

  it("rounds only the final total, not each yearly share", () => {
    // Each $1.00 yearly plan is 8.33 cents a month. Rounding each share would give 24 cents.
    const yearly = ["a", "b", "c"].map((id) => subscription({ id, billingCycle: "yearly", amountCents: 100 }));

    expect(averageMonthlyCostCents(yearly)).toBe(25);
  });

  it("combines monthly amounts with yearly shares before rounding", () => {
    // 999 + 9999 / 12 = 999 + 833.25 = 1832.25 cents.
    expect(
      averageMonthlyCostCents([
        subscription({ id: "m", amountCents: 999 }),
        subscription({ id: "y", amountCents: 9999, billingCycle: "yearly" }),
      ]),
    ).toBe(1832);
  });

  it.each([
    [5, 0],
    [6, 1],
    [18, 2],
    [11, 1],
  ])("rounds a yearly %i cents to %i cents a month, with half a cent rounding up", (yearlyCents, expected) => {
    expect(averageMonthlyCostCents([subscription({ id: "y", amountCents: yearlyCents, billingCycle: "yearly" })])).toBe(
      expected,
    );
  });
});
