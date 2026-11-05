// Next billing date for monthly and yearly subscriptions (issue #8).
export type BillingCycle = "monthly" | "yearly";

export function nextBillingDate(firstBillingDate: string, cycle: BillingCycle, today: string): string {
  void firstBillingDate;
  void cycle;
  void today;
  throw new Error("Not implemented: nextBillingDate");
}
