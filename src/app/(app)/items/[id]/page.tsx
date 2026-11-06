import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { findItem } from "@/features/items/item-repository";
import { ItemDetails } from "@/features/items/ItemDetails";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";

type ItemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
};

// The title and the page both need the item; cache() reads it once per request.
const loadItem = cache(async (id: string) => {
  const user = await getCurrentUser();
  return user ? findItem(getPool(), user.id, id) : null;
});

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const item = await loadItem((await params).id);
  return { title: item ? item.name : "Item not found" };
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/items/${id}`)}`);

  // Another user's item is not found either, so the page reveals nothing about it.
  const item = await loadItem(id);
  if (!item) notFound();

  return <ItemDetails item={item} saved={(await searchParams).saved === "1"} />;
}
