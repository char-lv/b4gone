import { NextResponse, type NextRequest } from "next/server";
import { fieldErrors, signInSchema } from "@/features/auth/auth-schema";
import { authenticate } from "@/features/auth/auth-service";
import { startSession } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  const body = await readJson(request);
  if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, fieldErrors(parsed.error));

  try {
    const user = await authenticate(getPool(), parsed.data);
    if (!user) return apiError(401, "invalid_credentials", "Invalid email or password.");
    const response = NextResponse.json({ user });
    await startSession(response, user.id);
    return response;
  } catch (error) {
    return serverError("Sign-in", error);
  }
}
