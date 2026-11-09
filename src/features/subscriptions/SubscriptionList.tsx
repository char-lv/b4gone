// The Subscriptions page body (issue #7): a table on wider screens that becomes one card per
// subscription on phones, like the Items list. Edit, cancel/reactivate, and delete live on the
// details page; after a delete the list opens with ?deleted=1.
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { FlashNotice } from "@/features/items/FlashNotice";
import { formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { NextCharge } from "./NextCharge";
import { averageMonthlyCostCents } from "./subscription-calculations";
import type { Subscription } from "./subscription-repository";
import { BILLING_CYCLE_LABELS, SubscriptionStatusTag } from "./SubscriptionLabels";

const COLUMNS = ["Service", "Amount", "Billing cycle", "First billing date", "Next charge", "Status"] as const;

// On phones the header row is hidden and each cell shows its column name from data-label.
const CELL =
  "border-b border-line px-4 py-3.5 align-top max-sm:grid max-sm:grid-cols-[8.5rem_1fr] max-sm:gap-x-2 max-sm:border-0 max-sm:px-0 max-sm:py-1 max-sm:before:text-sm max-sm:before:font-medium max-sm:before:text-muted max-sm:before:content-[attr(data-label)]";

function subscriptionCount(count: number): string {
  return `${count} ${count === 1 ? "subscription" : "subscriptions"}`;
}

function AddSubscriptionLink() {
  return (
    <Link href="/subscriptions/new" className={buttonClassName("primary")}>
      Add subscription
    </Link>
  );
}

export function SubscriptionList({ subscriptions, deleted = false }: { subscriptions: Subscription[]; deleted?: boolean }) {
  const cancelled = subscriptions.filter((subscription) => subscription.status === "cancelled").length;

  return (
    <>
      <FlashNotice show={deleted} param="deleted" message="Subscription deleted." focusId="subscriptions-title" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 max-sm:mb-5">
        {/* tabIndex lets the delete confirmation move focus here; the heading is not a tab stop. */}
        <h1
          id="subscriptions-title"
          tabIndex={-1}
          className="text-[1.375rem] font-semibold tracking-tight outline-none sm:text-[1.625rem]"
        >
          Subscriptions
        </h1>
        {subscriptions.length > 0 ? <AddSubscriptionLink /> : null}
      </div>

      {subscriptions.length === 0 ? (
        <section className="max-w-[40rem] rounded-card border border-line bg-surface px-[1.375rem] py-6 shadow-card">
          <h2 className="mb-1.5 text-[1.0625rem] font-semibold">No subscriptions yet</h2>
          <p className="mb-4 max-w-[36rem] text-muted">
            Add a monthly or yearly plan to see its next charge and what your subscriptions cost per month.
          </p>
          <AddSubscriptionLink />
        </section>
      ) : (
        <>
          <div className="-mt-3 mb-4 text-muted">
            <p>
              {subscriptionCount(subscriptions.length)}: {subscriptions.length - cancelled} active, {cancelled} cancelled.
            </p>
            <p>Average monthly cost of active subscriptions: {formatUsd(averageMonthlyCostCents(subscriptions))}</p>
          </div>
          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none">
            {/* Explicit roles keep the table semantics when the phone layout changes the display type. */}
            <table role="table" className="w-full border-collapse text-[0.9375rem] max-sm:block">
              <caption className="sr-only">Subscriptions</caption>
              <thead role="rowgroup" className="max-sm:sr-only">
                <tr role="row">
                  {COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      role="columnheader"
                      className={`border-b border-line px-4 py-3 text-[0.8125rem] font-semibold whitespace-nowrap text-muted ${
                        column === "Amount" ? "text-right" : "text-left"
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup" className="max-sm:block">
                {subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    role="row"
                    className="max-sm:mb-3 max-sm:block max-sm:rounded-card max-sm:border max-sm:border-line max-sm:bg-surface max-sm:p-4 max-sm:shadow-card [&:last-child>*]:border-b-0"
                  >
                    <th
                      scope="row"
                      role="rowheader"
                      data-label="Service"
                      className="border-b border-line px-4 py-3.5 text-left align-top font-normal max-sm:block max-sm:border-0 max-sm:px-0 max-sm:pt-0 max-sm:pb-2 max-sm:text-[1.0625rem]"
                    >
                      <Link
                        href={`/subscriptions/${subscription.id}`}
                        className="font-semibold break-words text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
                      >
                        {subscription.name}
                      </Link>
                    </th>
                    <td role="cell" data-label="Amount" className={`${CELL} text-right whitespace-nowrap tabular-nums max-sm:text-left`}>
                      {formatUsd(subscription.amountCents)}
                    </td>
                    <td role="cell" data-label="Billing cycle" className={CELL}>
                      {BILLING_CYCLE_LABELS[subscription.billingCycle]}
                    </td>
                    <td role="cell" data-label="First billing date" className={CELL}>
                      {formatDateOnly(subscription.firstBillingDate)}
                    </td>
                    <td role="cell" data-label="Next charge" className={CELL}>
                      <NextCharge subscription={subscription} />
                    </td>
                    <td role="cell" data-label="Status" className={`${CELL} max-sm:items-start`}>
                      <span className="max-sm:justify-self-start">
                        <SubscriptionStatusTag status={subscription.status} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
