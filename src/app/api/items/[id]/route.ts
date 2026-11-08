import { NextResponse, type NextRequest } from "next/server";
import { findItem } from "@/features/items/item-repository";
import { getRequestUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { apiError, serverError, unauthenticated } from "@/lib/http/api-response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthenticated();

    // Another user's item gets the same 404 as a missing one, so ids reveal nothing.
    const item = await findItem(getPool(), user.id, (await params).id);
    return item ? NextResponse.json({ item }) : apiError(404, "not_found", "Item not found.");
  } catch (error) {
    return serverError("Item lookup", error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  throw new Error("Not implemented");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  throw new Error("Not implemented");
}
