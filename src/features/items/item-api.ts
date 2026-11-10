// Request helpers shared by the item route handlers (issues #4 and #5).
import { apiError } from "@/lib/http/api-response";

// The user's today comes from the IANA time zone the browser sends with the item; the subscription
// routes (#7) read it the same way.
export { todayFromBody } from "@/lib/http/user-today";

/** Another user's item, a missing item, and a malformed id all get this same 404. */
export function itemNotFound(): Response {
  return apiError(404, "not_found", "Item not found.");
}
