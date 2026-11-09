"use client";

import type { DeadlineItem } from "@/features/items/item-deadlines";
import type { BillableSubscription } from "@/features/subscriptions/subscription-calculations";

/** The dashboard body (issue #9). */
export function DashboardView({ items, subscriptions }: { items: DeadlineItem[]; subscriptions: BillableSubscription[] }) {
  return <h1>{items.length + subscriptions.length}</h1>;
}
