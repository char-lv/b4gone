import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditItemPanel } from "@/features/items/EditItemPanel";
import { loadItem } from "@/features/items/load-item";
import { getCurrentUser } from "@/lib/auth/server-session";

type EditItemPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EditItemPageProps): Promise<Metadata> {
  const item = await loadItem((await params).id);
  return { title: item ? `Edit ${item.name}` : "Item not found" };
}

// The details route's not-found and error pages cover this page too. Like the details page it has
// no loading page, so "Item not found" keeps a real 404 status.
export default async function EditItemPage({ params }: EditItemPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/items/${id}/edit`)}`);

  const item = await loadItem(id);
  if (!item) notFound();

  return <EditItemPanel item={item} />;
}
