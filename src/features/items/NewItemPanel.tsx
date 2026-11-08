"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { AddItemForm } from "./AddItemForm";
import { formRejection, sendItemRequest } from "./item-client";
import type { NewItemInput } from "./item-schema";
import { getLocalToday, localTimeZone, useLocalToday } from "./local-today";

/** Saves the item for the signed-in user (issue #4) and resolves with its id. */
async function saveItem(item: NewItemInput): Promise<string> {
  try {
    // The server checks the purchase date against today in this time zone.
    const reply = (await sendItemRequest("/api/items", "POST", { ...item, timeZone: localTimeZone() })) as {
      item?: { id?: unknown };
    } | null;
    if (typeof reply?.item?.id === "string") return reply.item.id;
    throw new Error("The item was saved without an id in the reply.");
  } catch (error) {
    throw formRejection(error);
  }
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
