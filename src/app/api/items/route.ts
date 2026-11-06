import { NextResponse, type NextRequest } from "next/server";
import { createItem, listItems } from "@/features/items/item-repository";
import { validateNewItem } from "@/features/items/item-schema";
import { getRequestUser } from "@/lib/auth/server-session";
import { isValidTimeZone, todayInTimeZone } from "@/lib/dates";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

const TIME_ZONE_ERROR = "Your browser’s time zone could not be read. Reload the page and try again.";

// The browser sends its IANA time zone with each item so "today" is the user's date, not the server's.
function timeZoneOf(body: unknown): unknown {
  return typeof body === "object" && body !== null ? (body as { timeZone?: unknown }).timeZone : undefined;
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const timeZone = timeZoneOf(body);
    if (!isValidTimeZone(timeZone)) {
      return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, { timeZone: TIME_ZONE_ERROR });
    }
    const parsed = validateNewItem(body, todayInTimeZone(timeZone, new Date()));
    if (!parsed.success) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, parsed.fieldErrors);

    const item = await createItem(getPool(), user.id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return serverError("Item creation", error);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();
    return NextResponse.json({ items: await listItems(getPool(), user.id) });
  } catch (error) {
    return serverError("Item list", error);
  }
}
