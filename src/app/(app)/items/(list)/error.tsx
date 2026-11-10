"use client";

import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when the items cannot be read, for example while the database is unreachable.
export default function ItemsError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel title="Couldn’t load your items" onRetry={retry}>
      Your saved items are safe. Check your connection, then try again.
    </ErrorPanel>
  );
}
