import type { Metadata } from "next";
import { NewItemPanel } from "@/features/items/NewItemPanel";

export const metadata: Metadata = {
  title: "Add item · B4Gone",
};

export default function NewItemPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-14 sm:px-5 sm:pt-8">
      <NewItemPanel />
    </main>
  );
}
