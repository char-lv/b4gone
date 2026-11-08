"use client";

import { daysUntil, formatDateOnly, isUrgent, relativeDayText } from "@/lib/dates";
import { type DeadlineKind, dashboardDeadlines } from "./item-deadlines";
import type { Item } from "./item-repository";
import { useLocalToday } from "./local-today";

export const DEADLINE_LABELS: Record<DeadlineKind, string> = {
  return: "Return deadline",
  warranty: "Warranty expiration",
};

/**
 * The item's deadlines that the dashboard shows (issue #5), so a return or undo has a visible
 * effect before the dashboard exists (#9). The dates depend on the user's today, which only the
 * browser knows, so the server renders a placeholder and the list appears after hydration.
 */
export function ItemDashboardDeadlines({ item }: { item: Item }) {
  const today = useLocalToday();

  return (
    <section aria-labelledby="item-dashboard-title" className="mt-7 max-w-[46rem]">
      <h2 id="item-dashboard-title" className="mb-2 text-[1.0625rem] font-semibold">
        On the dashboard
      </h2>
      <DeadlineText item={item} today={today} />
    </section>
  );
}

function DeadlineText({ item, today }: { item: Item; today: string | null }) {
  if (item.status === "returned") {
    return (
      <p className="text-muted">
        Returned items don’t create dashboard deadlines. Undo the return to restore any of its dates that fall
        within the next 30 days.
      </p>
    );
  }
  if (!today) return <p className="text-muted">Checking dates…</p>;

  const deadlines = dashboardDeadlines(item, today);
  if (deadlines.length === 0) return <p className="text-muted">None of this item’s dates fall in the next 30 days.</p>;

  return (
    <ul className="grid list-disc gap-1 pl-5">
      {deadlines.map((deadline) => {
        const days = daysUntil(deadline.date, today);
        return (
          <li key={deadline.kind} className={isUrgent(days) ? "font-semibold text-urgent" : undefined}>
            {DEADLINE_LABELS[deadline.kind]}: {formatDateOnly(deadline.date)} ({relativeDayText(days)})
          </li>
        );
      })}
    </ul>
  );
}
