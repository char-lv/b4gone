import { NextResponse, type NextRequest } from "next/server";
import { subscriptionNotFound, subscriptionView } from "@/features/subscriptions/subscription-api";
import { setSubscriptionStatus, type SubscriptionStatus } from "@/features/subscriptions/subscription-repository";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";
import { todayFromBody } from "@/lib/http/user-today";

const STATUSES: readonly SubscriptionStatus[] = ["active", "cancelled"];

function statusOf(body: unknown): SubscriptionStatus | null {
  const status = typeof body === "object" && body !== null ? (body as { status?: unknown }).status : undefined;
  return STATUSES.find((candidate) => candidate === status) ?? null;
}

/**
 * Cancels a subscription or reactivates it (US-06). The record and its original billing anchor are
 * kept, so a reactivated subscription's next charge comes from that anchor again. Sending the
 * current status is not an error.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const status = statusOf(body);
    if (!status) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { status: "Choose active or cancelled." });
    const today = todayFromBody(body);
    if ("response" in today) return today.response;

    const subscription = await setSubscriptionStatus(getPool(), user.id, (await params).id, status);
    return subscription ? NextResponse.json({ subscription: subscriptionView(subscription, today.today) }) : subscriptionNotFound();
  } catch (error) {
    return serverError("Subscription status change", error);
  }
}
