"use client";

import { useRouter } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { localTimeZone } from "@/features/items/local-today";
import { useMountedRef } from "@/features/items/use-mounted-ref";
import { sendSubscriptionRequest, subscriptionFormRejection } from "./subscription-client";
import type { Subscription } from "./subscription-repository";
import { type NewSubscriptionInput, draftFromSubscription } from "./subscription-schema";
import { SubscriptionForm } from "./SubscriptionForm";
import { SUBSCRIPTION_STATUS_LABELS } from "./SubscriptionLabels";

/** The edit form for a saved subscription (issue #7): the add form's fields and rules, starting from the saved values. */
export function EditSubscriptionPanel({ subscription }: { subscription: Subscription }) {
  const router = useRouter();
  const detailsPath = `/subscriptions/${subscription.id}`;
  const mounted = useMountedRef();

  async function handleSubmit(input: NewSubscriptionInput): Promise<void> {
    try {
      // An edit replaces every field; the status is not part of it and stays as saved.
      await sendSubscriptionRequest(`/api/subscriptions/${subscription.id}`, "PUT", { ...input, timeZone: localTimeZone() });
    } catch (error) {
      throw subscriptionFormRejection(error);
    }
    router.refresh();
    if (!mounted.current) return;
    router.push(`${detailsPath}?saved=1`);
    // Stay in the saving state until the details page replaces this form.
    await new Promise<never>(() => {});
  }

  return (
    <>
      <BackLink href={detailsPath}>Back to subscription</BackLink>
      <div className="mb-6">
        <h1 id="edit-subscription-title" className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">
          Edit subscription
        </h1>
        <p className="mt-1.5 break-words text-muted">Editing “{subscription.name}”.</p>
        <p className="mt-1 text-muted">
          Status: {SUBSCRIPTION_STATUS_LABELS[subscription.status]}.{" "}
          {subscription.status === "active" ? "Cancel it from the details page." : "Reactivate it from the details page."}
        </p>
      </div>
      <SubscriptionForm
        labelledBy="edit-subscription-title"
        initialDraft={draftFromSubscription(subscription)}
        onSubmit={handleSubmit}
        onCancel={() => router.push(detailsPath)}
      />
    </>
  );
}
