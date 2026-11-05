import { nextBillingDate } from "./recurrence";

describe("nextBillingDate", () => {
  describe("today and future anchors", () => {
    it.each(["monthly", "yearly"] as const)("returns a %s charge due today as today", (cycle) => {
      expect(nextBillingDate("2026-11-05", cycle, "2026-11-05")).toBe("2026-11-05");
    });

    it.each([
      ["monthly", "2026-12-15"],
      ["yearly", "2028-02-29"],
    ] as const)("keeps a future %s first billing date as the next charge", (cycle, anchor) => {
      expect(nextBillingDate(anchor, cycle, "2026-11-05")).toBe(anchor);
    });
  });

  describe("monthly", () => {
    it.each([
      ["2026-11-05", "2026-11-15"],
      ["2026-11-15", "2026-11-15"],
      ["2026-11-16", "2026-12-15"],
      ["2026-12-25", "2027-01-15"],
    ])("from a Jan 15 anchor on %s returns %s", (today, expected) => {
      expect(nextBillingDate("2026-01-15", "monthly", today)).toBe(expected);
    });

    it.each([
      ["2026-02-01", "2026-02-28"],
      ["2026-03-01", "2026-03-31"],
      ["2026-04-05", "2026-04-30"],
      ["2026-05-01", "2026-05-31"],
      ["2028-02-01", "2028-02-29"],
      ["2028-03-01", "2028-03-31"],
    ])("from a Jan 31 anchor on %s returns %s, clamping only the short month", (today, expected) => {
      expect(nextBillingDate("2026-01-31", "monthly", today)).toBe(expected);
    });

    it("returns to the anchor day after a clamped month instead of recurring from the clamped date", () => {
      expect(nextBillingDate("2026-01-30", "monthly", "2026-02-15")).toBe("2026-02-28");
      expect(nextBillingDate("2026-01-30", "monthly", "2026-03-01")).toBe("2026-03-30");
    });

    it("moves to the next month when the clamped last day has passed", () => {
      expect(nextBillingDate("2026-01-31", "monthly", "2026-04-30")).toBe("2026-04-30");
      expect(nextBillingDate("2026-01-31", "monthly", "2026-05-01")).toBe("2026-05-31");
      expect(nextBillingDate("2026-08-31", "monthly", "2026-12-31")).toBe("2026-12-31");
      expect(nextBillingDate("2026-08-31", "monthly", "2027-01-01")).toBe("2027-01-31");
    });
  });

  describe("yearly", () => {
    it.each([
      ["2026-11-05", "2026-11-10"],
      ["2026-11-10", "2026-11-10"],
      ["2026-11-11", "2027-11-10"],
    ])("from a Nov 10, 2025 anchor on %s returns %s", (today, expected) => {
      expect(nextBillingDate("2025-11-10", "yearly", today)).toBe(expected);
    });

    it.each([
      ["2026-01-10", "2026-02-28"],
      ["2026-02-28", "2026-02-28"],
      ["2026-03-01", "2027-02-28"],
      ["2027-03-01", "2028-02-29"],
      ["2028-02-29", "2028-02-29"],
      ["2028-03-01", "2029-02-28"],
    ])("from a Feb 29, 2024 anchor on %s returns %s", (today, expected) => {
      expect(nextBillingDate("2024-02-29", "yearly", today)).toBe(expected);
    });

    it("follows the century leap-year rule", () => {
      expect(nextBillingDate("2096-02-29", "yearly", "2100-01-01")).toBe("2100-02-28");
      expect(nextBillingDate("2396-02-29", "yearly", "2400-01-01")).toBe("2400-02-29");
    });

    it("crosses into the next year from Dec 31", () => {
      expect(nextBillingDate("2025-12-31", "yearly", "2026-12-31")).toBe("2026-12-31");
      expect(nextBillingDate("2025-12-31", "yearly", "2027-01-01")).toBe("2027-12-31");
    });
  });

  describe("invalid dates", () => {
    it.each([
      ["first billing date", "2026-02-30", "2026-11-05"],
      ["first billing date", "2026-1-15", "2026-11-05"],
      ["today", "2026-01-15", "2026-13-01"],
      ["today", "2026-01-15", ""],
    ])("throws a RangeError for a malformed %s", (_label, anchor, today) => {
      expect(() => nextBillingDate(anchor, "monthly", today)).toThrow(RangeError);
    });
  });
});
