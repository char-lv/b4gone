"use client";

import { useLocalToday } from "@/features/items/local-today";
import { daysUntil, formatDateOnly, relativeDayText } from "@/lib/dates";
import { nextRenewals, type BillableSubscription } from "./subscription-calculations";

/**
 * A subscription's next charge from #8, in the user's local calendar (issue #7): the first occurrence
 * of the original anchor on or after today, with a text label such as "Due today". The server does not
 * know the user's time zone, so the date appears once the page runs in the browser, and it follows
 * the clock past midnight. A cancelled subscription has no next charge.
 */
export function NextCharge({ subscription }: { subscription: BillableSubscription }) {
  const today = useLocalToday();
  if (subscription.status === "cancelled") return <span className="text-muted">None while cancelled</span>;
  if (!today) return <span className="text-muted">Calculating…</span>;

  const [renewal] = nextRenewals([subscription], today);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="whitespace-nowrap">{formatDateOnly(renewal.date)}</span>
      <span className="text-sm whitespace-nowrap text-muted">{relativeDayText(daysUntil(renewal.date, today))}</span>
    </span>
  );
}
