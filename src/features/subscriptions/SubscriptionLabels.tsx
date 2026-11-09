import type { BillingCycle } from "@/lib/recurrence";
import type { SubscriptionStatus } from "./subscription-calculations";

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = { monthly: "Monthly", yearly: "Yearly" };
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = { active: "Active", cancelled: "Cancelled" };

/** Active or Cancelled as text, so the status never depends on color alone (issue #7). */
export function SubscriptionStatusTag({ status }: { status: SubscriptionStatus }) {
  const active = status === "active";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-px text-xs leading-normal font-semibold whitespace-nowrap ${
        active ? "border-transparent bg-accent-soft text-accent" : "border-line bg-neutral-soft text-muted"
      }`}
    >
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </span>
  );
}
