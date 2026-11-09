"use client";

import { useRouter } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { localTimeZone } from "@/features/items/local-today";
import { useMountedRef } from "@/features/items/use-mounted-ref";
import { sendSubscriptionRequest, subscriptionFormRejection } from "./subscription-client";
import type { NewSubscriptionInput } from "./subscription-schema";
import { SubscriptionForm } from "./SubscriptionForm";

/** Saves the subscription for the signed-in user (issue #7) and resolves with its id. */
async function saveSubscription(input: NewSubscriptionInput): Promise<string> {
  try {
    // The reply's next billing date is calculated for today in this time zone.
    const reply = (await sendSubscriptionRequest("/api/subscriptions", "POST", { ...input, timeZone: localTimeZone() })) as {
      subscription?: { id?: unknown };
    } | null;
    if (typeof reply?.subscription?.id === "string") return reply.subscription.id;
    throw new Error("The subscription was saved without an id in the reply.");
  } catch (error) {
    throw subscriptionFormRejection(error);
  }
}

export function NewSubscriptionPanel() {
  const router = useRouter();
  const mounted = useMountedRef();

  async function handleSubmit(input: NewSubscriptionInput): Promise<void> {
    const id = await saveSubscription(input);
    // Pages the router keeps, such as the list, load the new subscription.
    router.refresh();
    if (!mounted.current) return;
    router.push(`/subscriptions/${id}?saved=1`);
    // Stay in the saving state until the details page replaces this form, so it never shows empty.
    await new Promise<never>(() => {});
  }

  return (
    <>
      <BackLink href="/subscriptions">Back to subscriptions</BackLink>
      <div className="mb-6">
        <h1 id="add-subscription-title" className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">
          Add subscription
        </h1>
      </div>
      <SubscriptionForm labelledBy="add-subscription-title" onSubmit={handleSubmit} onCancel={() => router.push("/subscriptions")} />
    </>
  );
}
