"use client";

import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import type { DeadlineItem } from "@/features/items/item-deadlines";
import { useLocalToday } from "@/features/items/local-today";
import { averageMonthlyCostCents, type BillableSubscription } from "@/features/subscriptions/subscription-calculations";
import { daysUntil, formatDateOnly, isUrgent, relativeDayText } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { type DashboardEvent, type DashboardEventType, dashboardEvents } from "./dashboard-events";

// The row labels follow the prototype's dashboard list.
const TYPE_LABELS: Record<DashboardEventType, string> = {
  return: "Return deadline",
  warranty: "Warranty expiration",
  renewal: "Renewal",
};

type DashboardViewProps = { items: DeadlineItem[]; subscriptions: BillableSubscription[] };

function AddActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/items/new" className={buttonClassName("primary")}>
        Add item
      </Link>
      <Link href="/subscriptions/new" className={buttonClassName()}>
        Add subscription
      </Link>
    </div>
  );
}

function SummaryCard({ term, figure, children }: { term: string; figure: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-[1.375rem] py-5 shadow-card max-sm:px-[1.125rem] max-sm:py-4">
      <dt className="text-sm font-medium text-muted">{term}</dt>
      <dd className="mt-1.5">
        <span className="block text-[2rem] leading-tight font-[650] tracking-[-0.02em] tabular-nums">{figure}</span>
        <span className="mt-2 block text-sm text-muted">{children}</span>
      </dd>
    </div>
  );
}

function EventRow({ event, today }: { event: DashboardEvent; today: string }) {
  const days = daysUntil(event.date, today);
  const urgent = isUrgent(days);
  return (
    <li className="border-line [&+&]:border-t">
      <Link
        href={event.href}
        className="grid grid-cols-[minmax(0,1fr)_7.5rem_7.75rem] items-center gap-4 rounded-control px-3 py-[0.8125rem] hover:bg-surface-hover max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-y-2 max-sm:px-3 max-sm:py-3"
      >
        <span className="flex min-w-0 flex-col gap-[0.3125rem] max-sm:col-span-2">
          <span className="font-semibold [overflow-wrap:anywhere]">{event.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted">
            <span className="inline-block rounded-full bg-neutral-soft px-2 py-px font-medium">{TYPE_LABELS[event.type]}</span>
            {event.type === "renewal" && event.amountCents !== undefined ? (
              <span>
                {formatUsd(event.amountCents)} {event.billingCycle === "yearly" ? "per year" : "per month"}
              </span>
            ) : null}
          </span>
        </span>
        <span className="text-[0.9375rem] whitespace-nowrap tabular-nums max-sm:text-sm max-sm:text-muted">
          {formatDateOnly(event.date)}
        </span>
        <span
          className={`justify-self-end text-sm whitespace-nowrap ${
            urgent
              ? "rounded-full border border-urgent-line bg-urgent-soft px-2.5 py-0.5 font-[650] text-urgent"
              : "text-muted"
          }`}
        >
          {relativeDayText(days)}
        </span>
      </Link>
    </li>
  );
}

function EventGroup({
  id,
  title,
  events,
  today,
  emptyText,
  urgent,
}: {
  id: string;
  title: string;
  events: DashboardEvent[];
  today: string;
  emptyText: string;
  urgent: boolean;
}) {
  return (
    <div className="border-line [&+&]:border-t">
      <h3 id={id} className="flex items-center gap-2 px-[1.375rem] pt-4 pb-1.5 text-sm font-semibold text-muted max-sm:px-[1.125rem]">
        {title}{" "}
        <span
          className={`inline-grid h-[1.375rem] min-w-6 place-items-center rounded-full px-[0.4375rem] text-xs font-[650] ${
            urgent ? "bg-urgent-soft text-urgent" : "bg-neutral-soft text-ink"
          }`}
        >
          {events.length}{" "}
          <span className="sr-only">{events.length === 1 ? "deadline" : "deadlines"}</span>
        </span>
      </h3>
      {events.length > 0 ? (
        <ol aria-labelledby={id} className="px-2.5 pb-2.5 max-sm:px-1.5 max-sm:pb-1.5">
          {events.map((event) => (
            <EventRow key={`${event.type}-${event.recordId}`} event={event} today={today} />
          ))}
        </ol>
      ) : (
        <p className="px-[1.375rem] pt-1 pb-[1.125rem] text-[0.9375rem] text-muted max-sm:px-[1.125rem]">{emptyText}</p>
      )}
    </div>
  );
}

/**
 * The dashboard body (issue #9): two summary cards and the deadlines from today through day 30.
 * Only the browser knows the user's today, so the server renders a placeholder for the dates and the
 * list appears after hydration; it follows the clock past midnight. The average monthly cost does not
 * depend on today and renders on the server.
 */
export function DashboardView({ items, subscriptions }: DashboardViewProps) {
  const today = useLocalToday();
  const events = today ? dashboardEvents(items, subscriptions, today) : [];
  const soon = today ? events.filter((event) => isUrgent(daysUntil(event.date, today))) : [];
  const later = today ? events.filter((event) => !isUrgent(daysUntil(event.date, today))) : [];
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 max-sm:mb-5">
        <h1 className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">Dashboard</h1>
        <AddActions />
      </div>

      <dl className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 max-sm:mb-5 max-sm:gap-3">
        <SummaryCard term="Deadlines in the next 30 days" figure={today ? String(events.length) : "—"}>
          {today ? (
            <>
              {soon.length > 0 ? (
                <span className="font-[650] text-urgent">{soon.length} within 7 days.</span>
              ) : (
                "None within 7 days."
              )}{" "}
              Each return, warranty, or renewal date counts once.
            </>
          ) : (
            "Checking dates…"
          )}
        </SummaryCard>
        <SummaryCard term="Average monthly subscription cost" figure={formatUsd(averageMonthlyCostCents(subscriptions))}>
          {activeSubscriptions > 0
            ? "Monthly plans plus yearly plans divided by 12. Not a forecast of this month’s charges."
            : "No active subscriptions. Cancelled ones aren’t counted."}
        </SummaryCard>
      </dl>

      <section aria-labelledby="deadlines-title" className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-[1.375rem] py-[1.125rem] max-sm:px-[1.125rem]">
          <h2 id="deadlines-title" className="text-[1.0625rem] font-semibold">
            Upcoming deadlines
          </h2>
          <p className="text-sm text-muted">Soonest first</p>
        </div>

        {!today ? (
          <p className="px-[1.375rem] py-6 text-muted max-sm:px-[1.125rem]">Checking dates…</p>
        ) : events.length === 0 ? (
          <div className="px-[1.375rem] pt-6 pb-[1.625rem] max-sm:px-[1.125rem]">
            <h3 className="mb-1.5 font-semibold">No deadlines in the next 30 days</h3>
            <p className="mb-4 text-muted">
              Add a purchase with a return or warranty date, or add a subscription, and its next date shows up here.
            </p>
            <AddActions />
          </div>
        ) : (
          <>
            <EventGroup id="group-soon" title="Within 7 days" events={soon} today={today} emptyText="Nothing is due in the next 7 days." urgent />
            <EventGroup
              id="group-later"
              title="In 8–30 days"
              events={later}
              today={today}
              emptyText="Nothing is due 8 to 30 days from now."
              urgent={false}
            />
          </>
        )}
      </section>
    </>
  );
}
