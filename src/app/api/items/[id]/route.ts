import { NextResponse, type NextRequest } from "next/server";
import { deleteItem, findItem, updateItem } from "@/features/items/item-repository";
import { validateNewItem } from "@/features/items/item-schema";
import { getRequestUser } from "@/lib/auth/server-session";
import { isValidTimeZone, todayInTimeZone } from "@/lib/dates";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

type Context = { params: Promise<{ id: string }> };

const TIME_ZONE_ERROR = "Your browser’s time zone could not be read. Reload the page and try again.";
const MISSING_FIELD_ERROR = "Send this field, or null to leave it empty.";
// An edit replaces the whole item, so the optional fields must be sent too; null clears them.
const OPTIONAL_FIELDS = ["priceCents", "returnDeadline", "warrantyExpiration"] as const;

function itemNotFound(): Response {
  return apiError(404, "not_found", "Item not found.");
}

export async function GET(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    // Another user's item gets the same 404 as a missing one, so ids reveal nothing.
    const item = await findItem(getPool(), user.id, (await params).id);
    return item ? NextResponse.json({ item }) : itemNotFound();
  } catch (error) {
    return serverError("Item lookup", error);
  }
}

export async function PUT(request: NextRequest, { params }: Context): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const fields = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if (!isValidTimeZone(fields.timeZone)) {
      return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { timeZone: TIME_ZONE_ERROR });
    }
    const parsed = validateNewItem(body, todayInTimeZone(fields.timeZone, new Date()));
    const missing = Object.fromEntries(
      OPTIONAL_FIELDS.filter((field) => !(field in fields)).map((field) => [field, MISSING_FIELD_ERROR]),
    );
    const fieldErrors = { ...(parsed.success ? {} : parsed.fieldErrors), ...missing };
    if (!parsed.success || Object.keys(missing).length > 0) {
      return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, fieldErrors);
    }

    const item = await updateItem(getPool(), user.id, (await params).id, parsed.data);
    return item ? NextResponse.json({ item }) : itemNotFound();
  } catch (error) {
    return serverError("Item update", error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const deleted = await deleteItem(getPool(), user.id, (await params).id);
    return deleted ? new Response(null, { status: 204 }) : itemNotFound();
  } catch (error) {
    return serverError("Item deletion", error);
  }
}
