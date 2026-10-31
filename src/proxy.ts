import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  void request;
  return NextResponse.next();
}

export const config = { matcher: ["/proxy-not-configured"] };
