"use client";

import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when the subscriptions cannot be read, for example while the database is unreachable.
export default function SubscriptionsError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel title="Couldn’t load your subscriptions" onRetry={retry}>
      Your saved subscriptions are safe. Check your connection, then try again.
    </ErrorPanel>
  );
}
