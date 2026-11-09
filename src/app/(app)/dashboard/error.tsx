"use client";

import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when the dashboard's records cannot be read, for example while the database is unreachable.
export default function DashboardError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel title="Couldn’t load your dashboard" onRetry={retry}>
      Your saved items and subscriptions are safe. Check your connection, then try again.
    </ErrorPanel>
  );
}
