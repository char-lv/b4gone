import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ItemDetails } from "@/features/items/ItemDetails";
import { loadItem } from "@/features/items/load-item";
import { getCurrentUser } from "@/lib/auth/server-session";

type ItemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const item = await loadItem((await params).id);
  return { title: item ? item.name : "Item not found" };
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/items/${id}`)}`);

  const item = await loadItem(id);
  if (!item) notFound();

  return <ItemDetails item={item} saved={(await searchParams).saved === "1"} />;
}
