import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { findItem } from "@/features/items/item-repository";
import { ItemDetails } from "@/features/items/ItemDetails";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

export const metadata: Metadata = { title: "Item" };

type ItemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
};

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/items/${id}`)}`);

  // Another user's item is not found either, so the page reveals nothing about it.
  const item = await findItem(getPool(), user.id, id);
  if (!item) notFound();

  return <ItemDetails item={item} saved={(await searchParams).saved === "1"} />;
}
