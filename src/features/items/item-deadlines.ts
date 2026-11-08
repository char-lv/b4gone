// Return and warranty deadlines for saved items (issue #5). Shaped like nextRenewals (#8) so the
// dashboard (#9) can combine both and apply the 30-day window with isInDashboardWindow.
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

/** Deadlines on or after `today` for active items; returned items have none (US-04). */
export function itemDeadlines(items: readonly DeadlineItem[], today: string): ItemDeadline[] {
  throw new Error("Not implemented");
}
