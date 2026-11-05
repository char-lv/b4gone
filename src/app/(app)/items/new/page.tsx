import type { Metadata } from "next";
import { NewItemPanel } from "@/features/items/NewItemPanel";

export const metadata: Metadata = {
  title: "Add item",
};

// The (app) layout supplies the account header, the sign-in check, and the <main> landmark (#2).
export default function NewItemPage() {
  return <NewItemPanel />;
}
