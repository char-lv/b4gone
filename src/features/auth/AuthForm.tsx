"use client";

// Sign-in and registration form (issue #2). It validates with the same schema as the API, keeps the
// draft when a save fails, and blocks duplicate submissions while a request is in flight.
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { safeNextPath } from "@/lib/http/safe-redirect";
import { fieldErrors, registerSchema, signInSchema } from "./auth-schema";

export type AuthMode = "sign-in" | "register";
type Field = "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const MODES = {
  "sign-in": {
    endpoint: "/api/auth/login",
    schema: signInSchema,
    submit: "Sign in",
    pending: "Signing in…",
    passwordAutocomplete: "current-password",
    passwordHint: undefined,
  },
  register: {
    endpoint: "/api/auth/register",
    schema: registerSchema,
    submit: "Create account",
    pending: "Creating account…",
    passwordAutocomplete: "new-password",
    passwordHint: "At least 8 characters.",
  },
} as const;

const NETWORK_ERROR = "We couldn't reach B4Gone. Check your connection and try again.";
const UNKNOWN_ERROR = "Something went wrong. Please try again.";

type ApiErrorBody = { error?: { message?: string; fields?: Record<string, string> } };

function pickFieldErrors(fields: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (fields.email) errors.email = fields.email;
  if (fields.password) errors.password = fields.password;
  return errors;
}

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const settings = MODES[mode];
  const router = useRouter();
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function showFieldErrors(found: FieldErrors): void {
    setErrors(found);
    if (found.email) emailRef.current?.focus();
    else if (found.password) passwordRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (inFlight.current) return;
    setAlert(null);

    const parsed = settings.schema.safeParse({ email, password });
    if (!parsed.success) {
      showFieldErrors(pickFieldErrors(fieldErrors(parsed.error)));
      return;
    }
    setErrors({});
    inFlight.current = true;
    setPending(true);

    try {
      const response = await fetch(settings.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        // Stay disabled while the next page loads so the form cannot be sent twice.
        router.replace(safeNextPath(next));
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
      const fields = pickFieldErrors(body?.error?.fields ?? {});
      if (fields.email || fields.password) showFieldErrors(fields);
      else setAlert(body?.error?.message ?? UNKNOWN_ERROR);
    } catch {
      setAlert(NETWORK_ERROR);
    }
    inFlight.current = false;
    setPending(false);
  }

  const emailErrorId = `${id}-email-error`;
  const passwordErrorId = `${id}-password-error`;
  const passwordHintId = `${id}-password-hint`;
  const passwordDescribedBy =
    [errors.password ? passwordErrorId : null, settings.passwordHint ? passwordHintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {alert && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-control border border-urgent-line bg-urgent-soft px-4 py-3 text-[0.9375rem] font-medium text-urgent"
        >
          <ErrorBadge />
          <span>{alert}</span>
        </div>
      )}

      <Field label="Email" htmlFor={`${id}-email`}>
        <input
          ref={emailRef}
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          aria-required="true"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? emailErrorId : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass(Boolean(errors.email))}
        />
        {errors.email && <FieldError id={emailErrorId}>{errors.email}</FieldError>}
      </Field>

      <Field label="Password" htmlFor={`${id}-password`}>
        <div className="relative">
          <input
            ref={passwordRef}
            id={`${id}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={settings.passwordAutocomplete}
            aria-required="true"
            aria-invalid={errors.password ? "true" : undefined}
            aria-describedby={passwordDescribedBy}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass(Boolean(errors.password))} pr-18`}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute inset-y-1 right-1 rounded-[4px] px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <FieldError id={passwordErrorId}>{errors.password}</FieldError>}
        {settings.passwordHint && (
          <p id={passwordHintId} className="text-sm text-muted">
            {settings.passwordHint}
          </p>
        )}
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-accent bg-accent px-4 font-semibold text-white shadow-control transition-colors hover:border-accent-hover hover:bg-accent-hover disabled:cursor-progress disabled:opacity-75"
      >
        {pending && <Spinner />}
        {pending ? settings.pending : settings.submit}
      </button>
    </form>
  );
}

function inputClass(invalid: boolean): string {
  const base =
    "block h-11 w-full rounded-control border bg-surface px-3 text-base text-ink transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:outline-offset-1";
  return invalid
    ? `${base} border-urgent shadow-[inset_0_0_0_1px_var(--color-urgent)]`
    : `${base} border-line-strong hover:border-ink`;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between font-semibold">
        {label}{" "}
        <span className="text-sm font-normal text-muted">Required</span>
      </label>
      {children}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-urgent">
      <ErrorBadge />
      <span>{children}</span>
    </p>
  );
}

function ErrorBadge() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="mt-0.5 size-4.5 flex-none">
      <circle cx="9" cy="9" r="9" fill="var(--color-urgent)" />
      <path d="M9 4.5v5.25" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="13.1" r="1.15" fill="#fff" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:hidden"
    />
  );
}
