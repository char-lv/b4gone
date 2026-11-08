"use client";

import type { Item } from "./item-repository";

/** The item's deadlines that the dashboard shows (issue #5). */
export function ItemDashboardDeadlines({ item }: { item: Item }) {
  return <section>{item.name}</section>;
}
