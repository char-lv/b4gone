"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { AddItemForm } from "./AddItemForm";
import { formRejection, sendItemRequest } from "./item-client";
import type { Item } from "./item-repository";
import { type NewItemInput, draftFromItem } from "./item-schema";
import { getLocalToday, localTimeZone, useLocalToday } from "./local-today";

/** The edit form for a saved item (issue #5): the add form's fields and rules, starting from the saved values. */
export function EditItemPanel({ item }: { item: Item }) {
  const router = useRouter();
  const today = useLocalToday();
  const detailsPath = `/items/${item.id}`;
  // False once the user has left this page, for example through the navigation while a save is pending.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleSubmit(input: NewItemInput): Promise<void> {
    try {
      // An edit replaces the whole item, so every field is sent; the status is not part of it.
      await sendItemRequest(`/api/items/${item.id}`, "PUT", { ...input, timeZone: localTimeZone() });
    } catch (error) {
      throw formRejection(error);
    }
    // Pages the router already shows or keeps, such as the list and the details page, load the new values.
    router.refresh();
    if (!mounted.current) return;
    router.push(`${detailsPath}?saved=1`);
    // Stay in the saving state until the details page replaces this form.
    await new Promise<never>(() => {});
  }

  return (
    <>
      <BackLink href={detailsPath}>Back to item</BackLink>
      <div className="mb-6">
        <h1 id="edit-item-title" className="text-[1.375rem] font-semibold tracking-tight sm:text-[1.625rem]">
          Edit item
        </h1>
        <p className="mt-1.5 break-words text-muted">Editing “{item.name}”.</p>
      </div>

      {today ? (
        <AddItemForm
          getToday={getLocalToday}
          labelledBy="edit-item-title"
          initialDraft={draftFromItem(item)}
          onSubmit={handleSubmit}
          onCancel={() => router.push(detailsPath)}
        />
      ) : (
        <p className="text-muted">Loading form…</p>
      )}
    </>
  );
}
