"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { todayInTimeZone } from "@/lib/dates";
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

function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The user's current local calendar date, read from the clock each time it is called. */
function getLocalToday(): string {
  return todayInTimeZone(localTimeZone(), new Date());
}

// The server cannot know the user's time zone, so "today" is only known in the browser.
function getServerToday(): null {
  return null;
}

const SIGNED_OUT_MESSAGE =
  "You’ve been signed out. Your entries are still here. Sign in again in a new tab, then select “Save item”.";

/**
 * Saves the item for the signed-in user (issue #4) and resolves with its id. A rejection with
 * fieldErrors shows the server's messages next to the fields, one with formMessage shows that text
 * (a 401, or a time zone the server rejected), and any other rejection shows the retry message.
 */
async function saveItem(item: NewItemInput): Promise<string> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The server checks the purchase date against today in this time zone.
    body: JSON.stringify({ ...item, timeZone: localTimeZone() }),
  });
  const body: unknown = await response.json().catch(() => null);
  const result = (body ?? {}) as { item?: { id?: unknown }; error?: { fields?: { timeZone?: unknown } } };

  if (response.status === 201 && typeof result.item?.id === "string") return result.item.id;
  const fields = response.status === 400 ? result.error?.fields : undefined;
  throw Object.assign(new Error(`The item was not saved (HTTP ${response.status}).`), {
    fieldErrors: fields,
    formMessage: response.status === 401 ? SIGNED_OUT_MESSAGE : fields?.timeZone,
  });
}

export function NewItemPanel() {
  const router = useRouter();
  // Re-renders when the local date changes so the purchase date limit follows the clock.
  const today = useSyncExternalStore(subscribeToLocalDate, getLocalToday, getServerToday);

  async function handleSubmit(item: NewItemInput): Promise<void> {
    const id = await saveItem(item);
    router.push(`/items/${id}?saved=1`);
    // The router keeps pages it has shown, so without this Back would return to a list without the item.
    router.refresh();
    // Stay in the saving state until the details page replaces this form, so it never shows empty.
    await new Promise<never>(() => {});
  }

  return (
    <>
      <BackLink href="/items">Back to items</BackLink>
      <div className="mb-6">
        <h1 id="add-item-title" className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">
          Add item
        </h1>
      </div>

      {today ? (
        <AddItemForm
          getToday={getLocalToday}
          labelledBy="add-item-title"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/items")}
        />
      ) : (
        <p className="text-muted">Loading form…</p>
      )}
    </>
  );
}
