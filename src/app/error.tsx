"use client";

import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";

// Shown when no closer error page applies (issue #4). Error pages below a layout cannot catch that
// layout's errors, so this covers the signed-in user lookup in (app)/layout.tsx while the database is
// unreachable.
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <BackLink href="/">Go to the home page</BackLink>
      <section role="alert" className="max-w-[40rem] rounded-card border border-urgent-line bg-urgent-soft px-[1.375rem] py-6">
        <h1 className="mb-1.5 text-[1.0625rem] font-semibold">Something went wrong</h1>
        <p className="mb-4">Your saved items are safe. Check your connection, then try again.</p>
        <Button variant="primary" onClick={() => retry()}>
          Try again
        </Button>
      </section>
    </main>
  );
}
