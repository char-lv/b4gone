import { NextResponse, type NextRequest } from "next/server";
import { fieldErrors, registerSchema } from "@/features/auth/auth-schema";
import { registerUser } from "@/features/auth/auth-service";
import { EmailTakenError } from "@/features/auth/user-repository";
import { startSession } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { FIELD_ERRORS_MESSAGE, apiError, forbiddenOrigin, readJson, serverError } from "@/lib/http/api-response";
import { isSameOriginRequest } from "@/lib/http/origin";

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) return forbiddenOrigin();

  const body = await readJson(request);
  if (body === undefined) return apiError(400, "invalid_json", "Send the request body as JSON.");
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "validation_failed", FIELD_ERRORS_MESSAGE, fieldErrors(parsed.error));

  try {
    const user = await registerUser(getPool(), parsed.data);
    const response = NextResponse.json({ user }, { status: 201 });
    await startSession(response, user.id);
    return response;
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return apiError(409, "email_taken", FIELD_ERRORS_MESSAGE, {
        email: "An account with this email already exists. Sign in instead.",
      });
    }
    return serverError("Registration", error);
  }
}
