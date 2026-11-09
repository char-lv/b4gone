import { NextResponse, type NextRequest } from "next/server";
import { itemNotFound } from "@/features/items/item-api";
import { setItemStatus, type ItemStatus } from "@/features/items/item-repository";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

const STATUSES: readonly ItemStatus[] = ["active", "returned"];

function statusOf(body: unknown): ItemStatus | null {
  const status = typeof body === "object" && body !== null ? (body as { status?: unknown }).status : undefined;
  return STATUSES.find((candidate) => candidate === status) ?? null;
}

/** Marks an item returned or active again (US-04). Sending the current status is not an error. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const status = statusOf(body);
    if (!status) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { status: "Choose active or returned." });

    const item = await setItemStatus(getPool(), user.id, (await params).id, status);
    return item ? NextResponse.json({ item }) : itemNotFound();
  } catch (error) {
    return serverError("Item status change", error);
  }
}
