"use client";

import { Button } from "@/components/ui/Button";

// Shown when the items cannot be read, for example while the database is unreachable.
export default function ItemsError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section role="alert" className="max-w-[40rem] rounded-card border border-urgent-line bg-urgent-soft px-[1.375rem] py-6">
      <h1 className="mb-1.5 text-[1.0625rem] font-semibold">Couldn’t load your items</h1>
      <p className="mb-4">Your saved items are safe. Check your connection, then try again.</p>
      <Button variant="primary" onClick={() => retry()}>
        Try again
      </Button>
    </section>
  );
}
