import { NextResponse, type NextRequest } from "next/server";
import { endSession } from "@/lib/auth/server-session";
import { forbiddenOrigin } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  const response = new NextResponse(null, { status: 204 });
  endSession(response);
  return response;
}
