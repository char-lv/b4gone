// Browser-side calls to the subscription API (issue #7), with the messages the forms and actions show.
import type { SubscriptionFieldErrors } from "./subscription-schema";

export const SUBSCRIPTION_SIGNED_OUT_MESSAGE =
  "You’ve been signed out. Your entries are still here. Sign in again in a new tab, then select “Save subscription”.";
export const SUBSCRIPTION_GONE_MESSAGE = "This subscription no longer exists. It may have been deleted in another tab.";
export const SUBSCRIPTIONS_LINK = { href: "/subscriptions", label: "Go to your subscriptions" };

/** A request the subscription API answered with an error status; fields holds a 400's field messages. */
export class SubscriptionRequestError extends Error {
  readonly status: number;
  readonly fields: Record<string, string> | undefined;

  constructor(status: number, fields?: Record<string, string>) {
    super(`The subscription request failed (HTTP ${status}).`);
    this.name = "SubscriptionRequestError";
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Sends a JSON request to the subscription API and resolves with the parsed reply (null for an empty
 * one). An error status rejects with SubscriptionRequestError; a network failure rejects with the fetch error.
 */
export async function sendSubscriptionRequest(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method,
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
  const reply: unknown = await response.json().catch(() => null);
  if (response.ok) return reply;
  const fields =
    response.status === 400 ? (reply as { error?: { fields?: Record<string, string> } } | null)?.error?.fields : undefined;
  throw new SubscriptionRequestError(response.status, fields);
}

/**
 * What SubscriptionForm shows for a failed save: field messages for a 400, the time zone message (which
 * has no field), a sign-in hint for a 401, and a link to the list for a 404. Other failures get the
 * form's retry message.
 */
export function subscriptionFormRejection(error: unknown): Error & {
  fieldErrors?: SubscriptionFieldErrors;
  formMessage?: string;
  formLink?: { href: string; label: string };
} {
  if (!(error instanceof SubscriptionRequestError)) return error instanceof Error ? error : new Error(String(error));
  if (error.status === 401) return Object.assign(error, { formMessage: SUBSCRIPTION_SIGNED_OUT_MESSAGE });
  if (error.status === 404) return Object.assign(error, { formMessage: SUBSCRIPTION_GONE_MESSAGE, formLink: SUBSCRIPTIONS_LINK });
  return Object.assign(error, { fieldErrors: error.fields, formMessage: error.fields?.timeZone });
}
