// The dashboard's upcoming deadlines (issue #9): active items' return and warranty dates and each
// active subscription's next renewal, from today through day 30 inclusive.
import type { DeadlineItem } from "@/features/items/item-deadlines";
import type { BillableSubscription } from "@/features/subscriptions/subscription-calculations";
import type { BillingCycle } from "@/lib/recurrence";

export type DashboardEventType = "return" | "warranty" | "renewal";

export type DashboardEvent = {
  type: DashboardEventType;
  recordId: string;
  href: string;
  name: string;
  date: string;
  amountCents?: number;
  billingCycle?: BillingCycle;
};

export function dashboardEvents(
  items: readonly DeadlineItem[],
  subscriptions: readonly BillableSubscription[],
  today: string,
): DashboardEvent[] {
  throw new Error("Not implemented");
}
