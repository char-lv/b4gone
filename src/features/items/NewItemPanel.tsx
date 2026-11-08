"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { AddItemForm } from "./AddItemForm";
import type { NewItemInput } from "./item-schema";
import { getLocalToday, localTimeZone, useLocalToday } from "./local-today";

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
  const today = useLocalToday();
  // False once the user has left this page, for example through the navigation while a save is pending.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleSubmit(item: NewItemInput): Promise<void> {
    const id = await saveItem(item);
    // The router keeps pages it has shown, so without this Back would return to a list without the item.
    // It also updates a page the user opened while the save was pending.
    router.refresh();
    if (!mounted.current) return;
    router.push(`/items/${id}?saved=1`);
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
