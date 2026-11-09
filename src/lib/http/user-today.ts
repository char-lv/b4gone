// "Today" for a request is the user's calendar date, read from the IANA time zone the browser sends
// (issues #4 and #7). The server cannot know the user's time zone any other way.
import { isValidTimeZone, todayInTimeZone } from "@/lib/dates";
import { FIELD_ERRORS_MESSAGE, apiError } from "./api-response";

export const TIME_ZONE_ERROR = "Your browser’s time zone could not be read. Reload the page and try again.";

/** Today in the given time zone, or a 400 response when the value is missing or not a known time zone. */
export function todayForTimeZone(timeZone: unknown): { today: string } | { response: Response } {
  if (!isValidTimeZone(timeZone)) {
    return { response: apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { timeZone: TIME_ZONE_ERROR }) };
  }
  return { today: todayInTimeZone(timeZone, new Date()) };
}

/** Today from the `timeZone` field of a JSON request body. */
export function todayFromBody(body: unknown): { today: string } | { response: Response } {
  return todayForTimeZone(typeof body === "object" && body !== null ? (body as { timeZone?: unknown }).timeZone : undefined);
}
