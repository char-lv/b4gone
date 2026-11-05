// Renewal reminders and the average monthly cost for saved subscriptions (issue #8).
import { nextBillingDate, type BillingCycle } from "@/lib/recurrence";

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

/** One next renewal per active subscription; cancelled subscriptions give no reminder (US-06, US-07). */
export function nextRenewals(subscriptions: readonly BillableSubscription[], today: string): RenewalEvent[] {
  return subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => ({
      subscriptionId: subscription.id,
      name: subscription.name,
      date: nextBillingDate(subscription.firstBillingDate, subscription.billingCycle, today),
      amountCents: subscription.amountCents,
    }));
}

/**
 * Active monthly amounts plus one twelfth of active yearly amounts, in cents. The sum is kept in
 * twelfths of a cent so only the final total is rounded; half a cent rounds up.
 */
export function averageMonthlyCostCents(subscriptions: readonly BillableSubscription[]): number {
  let twelfthsOfCents = 0;
  for (const subscription of subscriptions) {
    if (subscription.status !== "active") continue;
    twelfthsOfCents += subscription.billingCycle === "monthly" ? subscription.amountCents * 12 : subscription.amountCents;
  }
  return Math.round(twelfthsOfCents / 12);
}
