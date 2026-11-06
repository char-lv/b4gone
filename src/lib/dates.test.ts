import { formatDateOnly, isValidDateOnly, isValidTimeZone, todayInTimeZone } from "./dates";

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
