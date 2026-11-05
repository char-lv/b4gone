import type { InputHTMLAttributes, Ref } from "react";

type FormFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "size"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Narrower widths for dates and amounts. */
  size?: "text" | "date" | "money";
  ref?: Ref<HTMLInputElement>;
};

const WIDTHS = {
  text: "sm:max-w-80",
  date: "sm:max-w-52",
  money: "sm:max-w-44",
} as const;

/** A labelled input with a required/optional flag, hint, and associated error message. */
export function FormField({ id, label, hint, error, required, size = "text", ref, ...inputProps }: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="mb-5 min-w-0">
      <label htmlFor={id} className="block font-semibold">
        {label}{" "}
        <span className="text-sm font-normal text-muted">{required ? "(required)" : "(optional)"}</span>
      </label>
      {hint ? (
        <p id={hintId} className="mt-0.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoComplete="off"
          className={`h-[2.625rem] w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 py-2 focus-visible:border-accent focus-visible:outline-offset-1 aria-invalid:border-urgent aria-invalid:shadow-[inset_0_0_0_1px_var(--color-urgent)] ${WIDTHS[size]}`}
          {...inputProps}
        />
        {error ? (
          <p id={errorId} className="flex flex-[1_1_14rem] items-start gap-1.5 text-sm font-semibold text-urgent">
            <span
              aria-hidden="true"
              className="mt-px inline-grid size-[1.125rem] flex-none place-items-center rounded-full bg-urgent text-xs font-bold text-white"
            >
              !
            </span>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
