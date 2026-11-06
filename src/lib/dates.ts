// Date-only values are "YYYY-MM-DD" strings. They are compared as strings and never
// converted through UTC timestamps, so a date cannot shift to another day.

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in a calendar month (1-12), counting Feb 29 in leap years. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidDateOnly(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function isValidTimeZone(_value: unknown): _value is string {
  throw new Error("Not implemented: isValidTimeZone");
}

/** The calendar date at `now` in an IANA time zone, such as "America/New_York". */
export function todayInTimeZone(timeZone: string, now: Date): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Formats a valid date-only value for display, such as "Oct 9, 2026". */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
}
