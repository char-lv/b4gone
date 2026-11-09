// The dashboard's upcoming deadlines (issue #9): active items' return and warranty dates and each
// active subscription's next renewal, from today through day 30 inclusive.
import { type DeadlineItem, itemDeadlines } from "@/features/items/item-deadlines";
import { type BillableSubscription, nextRenewals } from "@/features/subscriptions/subscription-calculations";
import { isInDashboardWindow } from "@/lib/dates";
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

const TYPE_ORDER: Record<DashboardEventType, number> = { return: 0, warranty: 1, renewal: 2 };

function compareEvents(a: DashboardEvent, b: DashboardEvent): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (
    TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }) ||
    (a.recordId < b.recordId ? -1 : a.recordId > b.recordId ? 1 : 0)
  );
}

/**
 * Upcoming events sorted by date, event type, and record name (PRD Section 3). Each active
 * subscription adds at most one renewal; an item can add both of its deadlines.
 */
export function dashboardEvents(
  items: readonly DeadlineItem[],
  subscriptions: readonly BillableSubscription[],
  today: string,
): DashboardEvent[] {
  // RenewalEvent (#8) carries the amount but not the cycle, which the dashboard row shows.
  const cycles = new Map(subscriptions.map((subscription) => [subscription.id, subscription.billingCycle]));
  const events: DashboardEvent[] = [
    ...itemDeadlines(items, today).map(
      (deadline): DashboardEvent => ({
        type: deadline.kind,
        recordId: deadline.itemId,
        href: `/items/${deadline.itemId}`,
        name: deadline.name,
        date: deadline.date,
      }),
    ),
    ...nextRenewals(subscriptions, today).map(
      (renewal): DashboardEvent => ({
        type: "renewal",
        recordId: renewal.subscriptionId,
        href: `/subscriptions/${renewal.subscriptionId}`,
        name: renewal.name,
        date: renewal.date,
        amountCents: renewal.amountCents,
        billingCycle: cycles.get(renewal.subscriptionId),
      }),
    ),
  ];
  return events.filter((event) => isInDashboardWindow(event.date, today)).sort(compareEvents);
}
