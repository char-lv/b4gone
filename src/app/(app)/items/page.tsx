import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listItems } from "@/features/items/item-repository";
import { ItemList } from "@/features/items/ItemList";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

export const metadata: Metadata = { title: "Items" };

// Layouts and pages render in parallel, so the page looks the user up itself before reading items.
export default async function ItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/items");

  return <ItemList items={await listItems(getPool(), user.id)} />;
}
