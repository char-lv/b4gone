"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { formatDateOnly, todayInTimeZone } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { AddItemForm } from "./AddItemForm";
import type { NewItemInput } from "./item-schema";

// How often an open page checks whether the local date has changed, such as at midnight.
const DATE_CHECK_INTERVAL_MS = 30_000;

function subscribeToLocalDate(onChange: () => void): () => void {
  const interval = setInterval(onChange, DATE_CHECK_INTERVAL_MS);
  // Timers pause while a laptop sleeps, so also check when the page becomes visible again.
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(interval);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** The user's current local calendar date, read from the clock each time it is called. */
function getLocalToday(): string {
  return todayInTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone, new Date());
}

// The server cannot know the user's time zone, so "today" is only known in the browser.
function getServerToday(): null {
  return null;
}

function describeItem(item: NewItemInput): string {
  const parts = [
    `Purchased ${formatDateOnly(item.purchaseDate)}`,
    item.priceCents === null ? "Price not entered" : formatUsd(item.priceCents),
  ];
  if (item.returnDeadline) parts.push(`Return by ${formatDateOnly(item.returnDeadline)}`);
  if (item.warrantyExpiration) parts.push(`Warranty until ${formatDateOnly(item.warrantyExpiration)}`);
  return parts.join(" · ");
}

export function NewItemPanel() {
  const router = useRouter();
  // Re-renders when the local date changes so the purchase date limit follows the clock.
  const today = useSyncExternalStore(subscribeToLocalDate, getLocalToday, getServerToday);
  const [submitted, setSubmitted] = useState<NewItemInput | null>(null);

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-block text-[0.9375rem] font-semibold text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover hover:decoration-current"
      >
        Back to home
      </Link>
      <div className="mb-6">
        <h1 id="add-item-title" className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">
          Add item
        </h1>
      </div>

      <div role="status" aria-live="polite">
        {submitted ? (
          <div className="mb-5 rounded-md border border-accent-line bg-accent-soft px-4 py-3 text-[0.9375rem]">
            <p className="font-semibold">“{submitted.name}” is ready.</p>
            <p>{describeItem(submitted)}</p>
            <p className="mt-1 text-muted">Saving items to your account isn’t available yet.</p>
          </div>
        ) : null}
      </div>

      {today ? (
        <AddItemForm
          getToday={getLocalToday}
          labelledBy="add-item-title"
          onSubmit={setSubmitted}
          onCancel={() => router.push("/")}
        />
      ) : (
        <p className="text-muted">Loading form…</p>
      )}
    </>
  );
}
