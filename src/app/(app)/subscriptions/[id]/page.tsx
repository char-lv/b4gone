import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loadSubscription } from "@/features/subscriptions/load-subscription";
import { SubscriptionDetails } from "@/features/subscriptions/SubscriptionDetails";
import { getCurrentUser } from "@/lib/auth/server-session";

type SubscriptionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
};

export async function generateMetadata({ params }: SubscriptionPageProps): Promise<Metadata> {
  const subscription = await loadSubscription((await params).id);
  return { title: subscription ? subscription.name : "Subscription not found" };
}

// Dashboard renewal events (#9) link here.
export default async function SubscriptionPage({ params, searchParams }: SubscriptionPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/subscriptions/${id}`)}`);

  const subscription = await loadSubscription(id);
  if (!subscription) notFound();

  return <SubscriptionDetails subscription={subscription} saved={(await searchParams).saved === "1"} />;
}
