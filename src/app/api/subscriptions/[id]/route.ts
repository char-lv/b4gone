import { NextResponse, type NextRequest } from "next/server";
import { subscriptionNotFound, subscriptionView, todayFromQuery } from "@/features/subscriptions/subscription-api";
import { deleteSubscription, findSubscription, updateSubscription } from "@/features/subscriptions/subscription-repository";
import { validateNewSubscription } from "@/features/subscriptions/subscription-schema";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";
import { todayFromBody } from "@/lib/http/user-today";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const today = todayFromQuery(request);
    if ("response" in today) return today.response;

    const subscription = await findSubscription(getPool(), user.id, (await params).id);
    return subscription ? NextResponse.json({ subscription: subscriptionView(subscription, today.today) }) : subscriptionNotFound();
  } catch (error) {
    return serverError("Subscription lookup", error);
  }
}

/** Replaces every editable field; the status stays as it is (use the status route to change it). */
export async function PUT(request: NextRequest, { params }: Context): Promise<Response> {
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

    const subscription = await updateSubscription(getPool(), user.id, (await params).id, parsed.data);
    return subscription ? NextResponse.json({ subscription: subscriptionView(subscription, today.today) }) : subscriptionNotFound();
  } catch (error) {
    return serverError("Subscription update", error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const deleted = await deleteSubscription(getPool(), user.id, (await params).id);
    return deleted ? new Response(null, { status: 204 }) : subscriptionNotFound();
  } catch (error) {
    return serverError("Subscription deletion", error);
  }
}
