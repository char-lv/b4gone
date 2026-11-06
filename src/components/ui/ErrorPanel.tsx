"use client";

import { Button } from "./Button";

/** The alert an error page shows: a heading, a short explanation, and Try again (issue #4). */
export function ErrorPanel({ title, children, onRetry }: { title: string; children: string; onRetry: () => void }) {
  return (
    <section role="alert" className="max-w-[40rem] rounded-card border border-urgent-line bg-urgent-soft px-[1.375rem] py-6">
      <h1 className="mb-1.5 text-[1.0625rem] font-semibold">{title}</h1>
      <p className="mb-4">{children}</p>
      <Button variant="primary" onClick={() => onRetry()}>
        Try again
      </Button>
    </section>
  );
}
