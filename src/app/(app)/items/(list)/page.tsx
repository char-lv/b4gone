import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listItems } from "@/features/items/item-repository";
import { ItemList } from "@/features/items/ItemList";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

export const metadata: Metadata = { title: "Items" };

// Layouts and pages render in parallel, so the page looks the user up itself before reading items.
// The (list) group gives only this page its loading and error states; the details page has none, so
// its "Item not found" keeps a real 404 status instead of being streamed after a 200.
export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ deleted?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/items");

  const deleted = (await searchParams).deleted === "1";
  return <ItemList items={await listItems(getPool(), user.id)} deleted={deleted} />;
}
