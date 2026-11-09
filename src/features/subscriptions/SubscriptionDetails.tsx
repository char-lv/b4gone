// One saved subscription (issue #7) with its next charge and its edit, cancel/reactivate, and delete actions.
import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { FlashNotice } from "@/features/items/FlashNotice";
import { NoticeScope } from "@/features/items/NoticeScope";
import { formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { NextCharge } from "./NextCharge";
import { SubscriptionActions } from "./SubscriptionActions";
import type { Subscription } from "./subscription-repository";
import { BILLING_CYCLE_LABELS, SUBSCRIPTION_STATUS_LABELS, SubscriptionStatusTag } from "./SubscriptionLabels";

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="border-b border-line px-5 py-3 text-[0.9375rem] font-medium text-muted max-sm:border-b-0 max-sm:pb-0">{term}</dt>
      <dd className="border-b border-line px-5 py-3">{children}</dd>
    </>
  );
}

export function SubscriptionDetails({ subscription, saved }: { subscription: Subscription; saved: boolean }) {
  return (
    <NoticeScope>
      <BackLink href="/subscriptions">Back to subscriptions</BackLink>

      <FlashNotice show={saved} param="saved" message="Subscription saved." focusId="subscription-title" />

      <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {/* tabIndex lets the save confirmation move focus here; the heading is not a tab stop. */}
        <h1
          id="subscription-title"
          tabIndex={-1}
          className="min-w-0 text-[1.375rem] font-semibold tracking-tight break-words outline-none sm:text-[1.625rem]"
        >
          {subscription.name}
        </h1>
        <SubscriptionStatusTag status={subscription.status} />
      </div>

      <dl className="grid max-w-[46rem] grid-cols-[minmax(10rem,13rem)_1fr] rounded-card border border-line bg-surface shadow-card max-sm:grid-cols-1 [&>:nth-last-child(-n+2)]:border-b-0">
        <Row term="Amount">{formatUsd(subscription.amountCents)}</Row>
        <Row term="Billing cycle">{BILLING_CYCLE_LABELS[subscription.billingCycle]}</Row>
        <Row term="First billing date">{formatDateOnly(subscription.firstBillingDate)}</Row>
        <Row term="Next charge">
          <NextCharge subscription={subscription} />
        </Row>
        <Row term="Status">{SUBSCRIPTION_STATUS_LABELS[subscription.status]}</Row>
      </dl>

      <SubscriptionActions subscription={subscription} />
    </NoticeScope>
  );
}
