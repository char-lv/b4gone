// Response helpers shared by the subscription route handlers (issue #7).
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/http/api-response";
import { todayForTimeZone } from "@/lib/http/user-today";
import { nextRenewals } from "./subscription-calculations";
import type { Subscription } from "./subscription-repository";

/** A subscription as the API returns it: the saved fields plus its next charge, or null when cancelled. */
export type SubscriptionView = Subscription & { nextBillingDate: string | null };

/** Adds the next billing date from #8, which is the first occurrence of the original anchor on or after today. */
export function subscriptionView(subscription: Subscription, today: string): SubscriptionView {
  const [renewal] = nextRenewals([subscription], today);
  return { ...subscription, nextBillingDate: renewal?.date ?? null };
}

/** Today from the `timeZone` query parameter of a GET request. */
export function todayFromQuery(request: NextRequest): { today: string } | { response: Response } {
  return todayForTimeZone(request.nextUrl.searchParams.get("timeZone") ?? undefined);
}

/** Another user's subscription, a missing one, and a malformed id all get this same 404. */
export function subscriptionNotFound(): Response {
  return apiError(404, "not_found", "Subscription not found.");
}
