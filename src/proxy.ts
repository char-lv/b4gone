// Optimistic route protection (issue #2): private pages need a valid session token before they render.
// Pages and API routes still look the user up on the server, so this is not the only check.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, readSessionSecret, verifySessionToken } from "@/lib/auth/session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return (await verifySessionToken(token, readSessionSecret(process.env))) !== null;
  } catch {
    // A missing SESSION_SECRET is reported by the API routes; here it just means "not signed in".
    return false;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (await hasValidSession(request)) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/dashboard/:path*", "/items/:path*", "/subscriptions/:path*"],
};
