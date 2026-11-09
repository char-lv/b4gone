import {
  daysUntil,
  formatDateOnly,
  isInDashboardWindow,
  isUrgent,
  isValidDateOnly,
  isValidTimeZone,
  relativeDayText,
  todayInTimeZone,
} from "./dates";

describe("isValidDateOnly", () => {
  it.each(["2026-10-23", "2024-02-29", "2026-01-31", "2000-02-29"])("accepts %s", (value) => {
    expect(isValidDateOnly(value)).toBe(true);
  });

  it.each([
    "",
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-10-00",
    "2026-1-5",
    "10/23/2026",
    "2026-10-23T00:00:00Z",
    " 2026-10-23",
    // PostgreSQL DATE has no year 0, so these would fail on insert instead of as a field error.
    "0000-01-01",
    "0000-02-29",
  ])("rejects %j", (value) => {
    expect(isValidDateOnly(value)).toBe(false);
  });
});

describe("todayInTimeZone", () => {
  // 2026-10-24 02:30 UTC is still October 23 in New York and already October 24 in Tokyo.
  const now = new Date("2026-10-24T02:30:00Z");

  it("derives the calendar date in the given time zone", () => {
    expect(todayInTimeZone("America/New_York", now)).toBe("2026-10-23");
    expect(todayInTimeZone("Asia/Tokyo", now)).toBe("2026-10-24");
    expect(todayInTimeZone("UTC", now)).toBe("2026-10-24");
  });

  it("rejects an unknown time zone", () => {
    expect(() => todayInTimeZone("Not/AZone", now)).toThrow(RangeError);
  });
});

// The item API (#4) receives the browser's IANA time zone and must refuse anything Intl cannot use.
describe("isValidTimeZone", () => {
  it.each(["America/New_York", "Asia/Tokyo", "UTC", "Pacific/Kiritimati"])("accepts %s", (timeZone) => {
    expect(isValidTimeZone(timeZone)).toBe(true);
  });

  it.each([undefined, null, 42, "", "  ", "Mars/Olympus_Mons", "America/New York"])("rejects %j", (timeZone) => {
    expect(isValidTimeZone(timeZone)).toBe(false);
  });
});

describe("formatDateOnly", () => {
  it("formats a date-only value without shifting the day", () => {
    expect(formatDateOnly("2026-10-09")).toBe("Oct 9, 2026");
    expect(formatDateOnly("2024-02-29")).toBe("Feb 29, 2024");
    expect(formatDateOnly("2026-12-31")).toBe("Dec 31, 2026");
  });
});

describe("daysUntil", () => {
  it.each([
    ["2026-11-08", "2026-11-08", 0],
    ["2026-11-09", "2026-11-08", 1],
    ["2026-11-07", "2026-11-08", -1],
    ["2026-12-08", "2026-11-08", 30],
    ["2027-01-01", "2026-12-31", 1],
    ["2024-03-01", "2024-02-28", 2],
    ["2026-03-01", "2026-02-28", 1],
    ["2025-01-01", "2024-01-01", 366],
    ["0001-01-02", "0001-01-01", 1],
    ["0100-03-01", "0100-02-28", 1],
  ])("counts calendar days from %s to today %s", (date, today, days) => {
    expect(daysUntil(date, today)).toBe(days);
  });
});

describe("isInDashboardWindow", () => {
  const today = "2026-11-08";

  it.each(["2026-11-08", "2026-11-15", "2026-12-08"])("includes %s (days 0 to 30)", (date) => {
    expect(isInDashboardWindow(date, today)).toBe(true);
  });

  it.each(["2026-11-07", "2026-12-09", "2027-11-08"])("excludes %s", (date) => {
    expect(isInDashboardWindow(date, today)).toBe(false);
  });
});

describe("isUrgent", () => {
  it.each([
    [0, true],
    [7, true],
    [8, false],
    [-1, false],
  ])("treats day %i as urgent: %s", (days, urgent) => {
    expect(isUrgent(days)).toBe(urgent);
  });
});

describe("relativeDayText", () => {
  it.each([
    [0, "Due today"],
    [1, "Due tomorrow"],
    [3, "In 3 days"],
    [30, "In 30 days"],
    [-1, "Passed yesterday"],
    [-4, "Passed 4 days ago"],
  ])("describes day %i as %j", (days, text) => {
    expect(relativeDayText(days)).toBe(text);
  });
});
