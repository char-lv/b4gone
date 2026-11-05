// Reads and writes the session cookie on the server (issue #2). Route handlers and Server Components
// get the signed-in user here; the owner ID always comes from the verified token, never the client.
import "server-only";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { findUserById, type User } from "@/features/auth/user-repository";
import { getPool } from "@/lib/db/pool";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  readSessionSecret,
  sessionCookieOptions,
  verifySessionToken,
} from "./session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Returns the user for a session token, or null if the token is invalid or the account is gone. */
export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const session = await verifySessionToken(token, readSessionSecret(process.env));
  if (!session || !UUID.test(session.userId)) return null;
  return findUserById(getPool(), session.userId);
}

/** The signed-in user for a route handler request. */
export async function getRequestUser(request: NextRequest): Promise<User | null> {
  return userFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

/** The signed-in user for a Server Component or page. */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  return userFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function startSession(response: NextResponse, userId: string): Promise<void> {
  const token = await createSessionToken(userId, readSessionSecret(process.env));
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(isProduction()));
}

export function endSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(isProduction()), maxAge: 0 });
}
