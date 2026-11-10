// Return and warranty deadlines for saved items (issue #5). Shaped like nextRenewals (#8) so the
// dashboard (#9) can combine both and apply the 30-day window with isInDashboardWindow.
import { isInDashboardWindow } from "@/lib/dates";
import type { ItemStatus } from "./item-repository";

export type DeadlineKind = "return" | "warranty";

/** The saved fields these deadlines read. */
export type DeadlineItem = {
  id: string;
  name: string;
  returnDeadline: string | null;
  warrantyExpiration: string | null;
  status: ItemStatus;
};

export type ItemDeadline = {
  itemId: string;
  name: string;
  kind: DeadlineKind;
  date: string;
};

const KIND_ORDER: Record<DeadlineKind, number> = { return: 0, warranty: 1 };

/** Deadlines on or after `today` for active items; returned items have none (US-04). */
export function itemDeadlines(items: readonly DeadlineItem[], today: string): ItemDeadline[] {
  const deadlines: ItemDeadline[] = [];
  for (const item of items) {
    if (item.status !== "active") continue;
    if (item.returnDeadline && item.returnDeadline >= today) {
      deadlines.push({ itemId: item.id, name: item.name, kind: "return", date: item.returnDeadline });
    }
    if (item.warrantyExpiration && item.warrantyExpiration >= today) {
      deadlines.push({ itemId: item.id, name: item.name, kind: "warranty", date: item.warrantyExpiration });
    }
  }
  return deadlines.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.name.localeCompare(b.name, "en-US"),
  );
}

/** One item's deadlines that the dashboard shows today: days 0-30, none when returned. */
export function dashboardDeadlines(item: DeadlineItem, today: string): ItemDeadline[] {
  return itemDeadlines([item], today).filter((deadline) => isInDashboardWindow(deadline.date, today));
}
