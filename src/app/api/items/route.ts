import { NextResponse, type NextRequest } from "next/server";
import { todayFromBody } from "@/features/items/item-api";
import { createItem, listItems } from "@/features/items/item-repository";
import { validateNewItem } from "@/features/items/item-schema";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError, unauthenticated } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    const body = await readJson(request);
    if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");

    const today = todayFromBody(body);
    if ("response" in today) return today.response;
    const parsed = validateNewItem(body, today.today);
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
