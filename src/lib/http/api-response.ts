// Consistent JSON error responses for the API (issue #2): { error: { code, message, fields? } }.
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "validation_failed"
  | "invalid_json"
  | "email_taken"
  | "invalid_credentials"
  | "unauthenticated"
  | "not_found"
  | "forbidden_origin"
  | "server_error";

export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string> };
};

export const FIELD_ERRORS_MESSAGE = "Check the highlighted fields.";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export function forbiddenOrigin(): NextResponse<ApiErrorBody> {
  return apiError(403, "forbidden_origin", "This request must come from the B4Gone site.");
}

export function unauthenticated(): NextResponse<ApiErrorBody> {
  return apiError(401, "unauthenticated", "Sign in to continue.");
}

/** Logs only the error's name so request bodies, passwords, and tokens never reach the logs. */
export function serverError(context: string, error: unknown): NextResponse<ApiErrorBody> {
  console.error(`${context} failed: ${error instanceof Error ? error.name : "unknown error"}`);
  return apiError(500, "server_error", "Something went wrong. Please try again.");
}

/**
 * Parses a JSON body, returning undefined when it is missing, malformed, or not sent as
 * application/json. Cross-site forms can post text/plain without a preflight; JSON requests cannot.
 */
export async function readJson(request: Request): Promise<unknown> {
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") return undefined;
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
