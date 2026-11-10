import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listSubscriptions } from "@/features/subscriptions/subscription-repository";
import { SubscriptionList } from "@/features/subscriptions/SubscriptionList";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

export const metadata: Metadata = { title: "Subscriptions" };

// Like the Items list (#4): the page looks the user up itself, and the (list) group gives only this
// page its loading and error states, so the details page keeps a real 404 status.
export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ deleted?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/subscriptions");

  const deleted = (await searchParams).deleted === "1";
  return <SubscriptionList subscriptions={await listSubscriptions(getPool(), user.id)} deleted={deleted} />;
}
