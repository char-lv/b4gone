import type { Metadata } from "next";
import { NewSubscriptionPanel } from "@/features/subscriptions/NewSubscriptionPanel";

export const metadata: Metadata = { title: "Add subscription" };

// The (app) layout supplies the account header, the sign-in check, and the <main> landmark (#2).
export default function NewSubscriptionPage() {
  return <NewSubscriptionPanel />;
}
