// Next billing date for monthly and yearly subscriptions (issue #8). Dates are "YYYY-MM-DD"
// strings handled as calendar numbers, never through UTC timestamps.
export type BillingCycle = "monthly" | "yearly";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseDate(value: string, label: string): { year: number; month: number; day: number } {
  const match = DATE_ONLY_PATTERN.exec(value);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  if (!match || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`${label} must be a valid YYYY-MM-DD date.`);
  }
  return { year, month, day };
}

function formatDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The anchor day in a given month, or that month's last day when the month is shorter. */
function occurrence(year: number, month: number, anchorDay: number): string {
  return formatDate(year, month, Math.min(anchorDay, daysInMonth(year, month)));
}

/**
 * The first billing occurrence on or after `today`. Every occurrence is derived from the original
 * anchor, so a Jan 31 anchor gives Feb 28 and then Mar 31, never Mar 28.
 */
export function nextBillingDate(firstBillingDate: string, cycle: BillingCycle, today: string): string {
  const anchor = parseDate(firstBillingDate, "firstBillingDate");
  const now = parseDate(today, "today");
  if (firstBillingDate >= today) return firstBillingDate;

  if (cycle === "yearly") {
    const thisYear = occurrence(now.year, anchor.month, anchor.day);
    return thisYear >= today ? thisYear : occurrence(now.year + 1, anchor.month, anchor.day);
  }

  const thisMonth = occurrence(now.year, now.month, anchor.day);
  if (thisMonth >= today) return thisMonth;
  return now.month === 12 ? occurrence(now.year + 1, 1, anchor.day) : occurrence(now.year, now.month + 1, anchor.day);
}
