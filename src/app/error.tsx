"use client";

import { BackLink } from "@/components/ui/BackLink";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

// Shown when no closer error page applies (issue #4), on public pages too, so the text assumes nothing
// about the visitor. Error pages below a layout cannot catch that layout's errors, so this also covers
// the signed-in user lookup in (app)/layout.tsx while the database is unreachable.
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <BackLink href="/">Go to the home page</BackLink>
      <ErrorPanel title="Something went wrong" onRetry={retry}>
        This page couldn’t be loaded. Try again in a moment.
      </ErrorPanel>
    </main>
  );
}
