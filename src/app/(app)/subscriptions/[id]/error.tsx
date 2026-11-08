"use client";

import { BackLink } from "@/components/ui/BackLink";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when a subscription cannot be read, for example while the database is unreachable. A missing
// or foreign subscription uses not-found.tsx instead.
export default function SubscriptionError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <BackLink href="/subscriptions">Back to subscriptions</BackLink>
      <ErrorPanel title="Couldn’t load this subscription" onRetry={retry}>
        Your saved subscriptions are safe. Check your connection, then try again.
      </ErrorPanel>
    </>
  );
}
