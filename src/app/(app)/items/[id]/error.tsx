"use client";

import { BackLink } from "@/components/ui/BackLink";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when an item cannot be read, for example while the database is unreachable. A missing or
// foreign item uses not-found.tsx instead.
export default function ItemError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <BackLink href="/items">Back to items</BackLink>
      <ErrorPanel title="Couldn’t load this item" onRetry={retry}>
        Your saved items are safe. Check your connection, then try again.
      </ErrorPanel>
    </>
  );
}
