// Renewal reminders and the average monthly cost for saved subscriptions (issue #8).
import type { BillingCycle } from "@/lib/recurrence";

export type SubscriptionStatus = "active" | "cancelled";

/** The saved fields these calculations read; #7 stores them, #9 displays the results. */
export type BillableSubscription = {
  id: string;
  name: string;
  amountCents: number;
  billingCycle: BillingCycle;
  firstBillingDate: string;
  status: SubscriptionStatus;
};

export type RenewalEvent = {
  subscriptionId: string;
  name: string;
  date: string;
  amountCents: number;
};

export function nextRenewals(subscriptions: readonly BillableSubscription[], today: string): RenewalEvent[] {
  void subscriptions;
  void today;
  throw new Error("Not implemented: nextRenewals");
}

export function averageMonthlyCostCents(subscriptions: readonly BillableSubscription[]): number {
  void subscriptions;
  throw new Error("Not implemented: averageMonthlyCostCents");
}
