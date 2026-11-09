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
  // PostgreSQL DATE has no year 0, so the earliest date it can store from this format is 0001-01-01.
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** True for an IANA time zone name that Intl accepts, such as "America/New_York". */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
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

export const DASHBOARD_WINDOW_DAYS = 30;
export const URGENT_DAYS = 7;

/** Days since 1970-01-01 in the proleptic Gregorian calendar, without Date (which maps years 0-99 to 1900s). */
function dayNumber(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  // Count March as the first month so the leap day falls at the end of the shifted year.
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Calendar days from `today` to `date`: 0 for today, negative for past dates. */
export function daysUntil(date: string, today: string): number {
  return dayNumber(date) - dayNumber(today);
}

/** Dashboard reminders cover today through day 30 inclusive. */
export function isInDashboardWindow(date: string, today: string): boolean {
  const days = daysUntil(date, today);
  return days >= 0 && days <= DASHBOARD_WINDOW_DAYS;
}

/** Deadlines on days 0-7 inclusive are urgent. */
export function isUrgent(days: number): boolean {
  return days >= 0 && days <= URGENT_DAYS;
}

/** Text for a deadline's distance from today, such as "Due today" or "In 3 days". */
export function relativeDayText(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "Passed yesterday";
  return `Passed ${-days} days ago`;
}
