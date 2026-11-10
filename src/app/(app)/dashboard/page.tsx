import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { listItems } from "@/features/items/item-repository";
import { listSubscriptions } from "@/features/subscriptions/subscription-repository";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

export const metadata: Metadata = { title: "Dashboard" };

// The signed-in home (issue #9). The page reads the owner's records on the server; the events depend
// on the user's today, which only the browser knows, so DashboardView computes them there.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const [items, subscriptions] = await Promise.all([listItems(getPool(), user.id), listSubscriptions(getPool(), user.id)]);
  // Only the fields the deadlines need go to the browser.
  const deadlineItems = items.map(({ id, name, returnDeadline, warrantyExpiration, status }) => ({
    id,
    name,
    returnDeadline,
    warrantyExpiration,
    status,
  }));
  return <DashboardView items={deadlineItems} subscriptions={subscriptions} />;
}
