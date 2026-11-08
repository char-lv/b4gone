import { NextResponse, type NextRequest } from "next/server";
import { subscriptionView, todayFromQuery } from "@/features/subscriptions/subscription-api";
import { averageMonthlyCostCents } from "@/features/subscriptions/subscription-calculations";
import { createSubscription, listSubscriptions } from "@/features/subscriptions/subscription-repository";
import { validateNewSubscription } from "@/features/subscriptions/subscription-schema";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";
import { todayFromBody } from "@/lib/http/user-today";

/** Saves a new, active subscription for the signed-in user (US-05). */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const today = todayFromBody(body);
    if ("response" in today) return today.response;
    const parsed = validateNewSubscription(body);
    if (!parsed.success) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, parsed.fieldErrors);

    const subscription = await createSubscription(getPool(), user.id, parsed.data);
    return NextResponse.json({ subscription: subscriptionView(subscription, today.today) }, { status: 201 });
  } catch (error) {
    return serverError("Subscription creation", error);
  }
}

/** The user's subscriptions with next billing dates, and the average monthly cost of the active ones. */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const today = todayFromQuery(request);
    if ("response" in today) return today.response;

    const subscriptions = await listSubscriptions(getPool(), user.id);
    return NextResponse.json({
      subscriptions: subscriptions.map((subscription) => subscriptionView(subscription, today.today)),
      averageMonthlyCostCents: averageMonthlyCostCents(subscriptions),
    });
  } catch (error) {
    return serverError("Subscription list", error);
  }
}
