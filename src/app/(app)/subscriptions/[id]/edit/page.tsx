import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditSubscriptionPanel } from "@/features/subscriptions/EditSubscriptionPanel";
import { loadSubscription } from "@/features/subscriptions/load-subscription";
import { getCurrentUser } from "@/lib/auth/server-session";

type EditSubscriptionPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EditSubscriptionPageProps): Promise<Metadata> {
  const subscription = await loadSubscription((await params).id);
  return { title: subscription ? `Edit ${subscription.name}` : "Subscription not found" };
}

// The details route's not-found and error pages cover this page too.
export default async function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/subscriptions/${id}/edit`)}`);

  const subscription = await loadSubscription(id);
  if (!subscription) notFound();

  return <EditSubscriptionPanel subscription={subscription} />;
}
