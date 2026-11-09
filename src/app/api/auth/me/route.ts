import { NextResponse, type NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth/server-session";
import { serverError, unauthenticated } from "@/lib/http/api-response";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getRequestUser(request);
    return user ? NextResponse.json({ user }) : unauthenticated();
  } catch (error) {
    return serverError("Session lookup", error);
  }
}
