// Shared registration and sign-in validation (issue #2). The forms and the API routes both use these
// schemas, so field messages stay identical on the client and the server.
import { z } from "zod";

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

const MESSAGES = {
  emailMissing: "Enter your email address.",
  emailInvalid: "Enter a valid email address, like name@example.com.",
  emailTooLong: `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`,
  newPasswordMissing: "Enter a password.",
  passwordMissing: "Enter your password.",
  passwordTooShort: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  passwordTooLong: `Password must be at most ${PASSWORD_MAX_BYTES} bytes. Some characters count as more than one byte.`,
} as const;

function fitsBcrypt(password: string): boolean {
  return new TextEncoder().encode(password).byteLength <= PASSWORD_MAX_BYTES;
}

const email = z
  .string({ error: MESSAGES.emailMissing })
  .trim()
  .toLowerCase()
  .min(1, MESSAGES.emailMissing)
  .max(EMAIL_MAX_LENGTH, MESSAGES.emailTooLong)
  .pipe(z.email(MESSAGES.emailInvalid));

// Passwords are never trimmed: spaces are part of what the user typed.
export const registerSchema = z.object({
  email,
  password: z
    .string({ error: MESSAGES.newPasswordMissing })
    .min(1, MESSAGES.newPasswordMissing)
    .min(PASSWORD_MIN_LENGTH, MESSAGES.passwordTooShort)
    .refine(fitsBcrypt, MESSAGES.passwordTooLong),
});

export const signInSchema = z.object({
  email,
  password: z
    .string({ error: MESSAGES.passwordMissing })
    .min(1, MESSAGES.passwordMissing)
    .refine(fitsBcrypt, MESSAGES.passwordTooLong),
});

export type Credentials = z.infer<typeof registerSchema>;

/** Returns the first message for each invalid field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}
