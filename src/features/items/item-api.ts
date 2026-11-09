// Request helpers shared by the item route handlers (issues #4 and #5).
import { isValidTimeZone, todayInTimeZone } from "@/lib/dates";
import { FIELD_ERRORS_MESSAGE, apiError } from "@/lib/http/api-response";

const TIME_ZONE_ERROR = "Your browser’s time zone could not be read. Reload the page and try again.";

/**
 * The user's today from the IANA time zone the browser sends with the item, so "today" is the
 * user's date, not the server's. A missing or unknown time zone gives a 400 response instead.
 */
export function todayFromBody(body: unknown): { today: string } | { response: Response } {
  const timeZone = typeof body === "object" && body !== null ? (body as { timeZone?: unknown }).timeZone : undefined;
  if (!isValidTimeZone(timeZone)) {
    return { response: apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { timeZone: TIME_ZONE_ERROR }) };
  }
  return { today: todayInTimeZone(timeZone, new Date()) };
}

/** Another user's item, a missing item, and a malformed id all get this same 404. */
export function itemNotFound(): Response {
  return apiError(404, "not_found", "Item not found.");
}
