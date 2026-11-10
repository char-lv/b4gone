// Browser-side calls to the item API (issues #4 and #5), with the messages the forms and actions show.
import type { ItemFieldErrors } from "./item-schema";

export const SIGNED_OUT_MESSAGE =
  "You’ve been signed out. Your entries are still here. Sign in again in a new tab, then select “Save item”.";
export const ITEM_GONE_MESSAGE = "This item no longer exists. It may have been deleted in another tab.";
export const ITEMS_LINK = { href: "/items", label: "Go to your items" };

/** A request the item API answered with an error status; fields holds a 400's field messages. */
export class ItemRequestError extends Error {
  readonly status: number;
  readonly fields: Record<string, string> | undefined;

  constructor(status: number, fields?: Record<string, string>) {
    super(`The item request failed (HTTP ${status}).`);
    this.name = "ItemRequestError";
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Sends a JSON request to the item API and resolves with the parsed reply (null for an empty one).
 * An error status rejects with ItemRequestError; a network failure rejects with the fetch error.
 */
export async function sendItemRequest(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method,
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
  const reply: unknown = await response.json().catch(() => null);
  if (response.ok) return reply;
  const fields = response.status === 400 ? (reply as { error?: { fields?: Record<string, string> } } | null)?.error?.fields : undefined;
  throw new ItemRequestError(response.status, fields);
}

/**
 * What AddItemForm shows for a failed save: field messages for a 400, the time zone message (which
 * has no field), a sign-in hint for a 401, and a link to the list for a 404. Other failures get the
 * form's retry message.
 */
export function formRejection(error: unknown): Error & {
  fieldErrors?: ItemFieldErrors;
  formMessage?: string;
  formLink?: { href: string; label: string };
} {
  if (!(error instanceof ItemRequestError)) return error instanceof Error ? error : new Error(String(error));
  if (error.status === 401) return Object.assign(error, { formMessage: SIGNED_OUT_MESSAGE });
  if (error.status === 404) return Object.assign(error, { formMessage: ITEM_GONE_MESSAGE, formLink: ITEMS_LINK });
  return Object.assign(error, { fieldErrors: error.fields, formMessage: error.fields?.timeZone });
}
