"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useLocalToday } from "@/features/items/local-today";
import { daysUntil, formatDateOnly, isValidDateOnly, relativeDayText } from "@/lib/dates";
import { nextBillingDate } from "@/lib/recurrence";
import { BILLING_CYCLE_LABELS } from "./SubscriptionLabels";
import {
  BILLING_CYCLES,
  INVALID_DATE_MESSAGE,
  SUBSCRIPTION_FIELDS,
  type NewSubscriptionInput,
  type SubscriptionDraft,
  type SubscriptionField,
  type SubscriptionFieldErrors,
  subscriptionFieldErrorsFromRejection,
  validateSubscriptionDraft,
} from "./subscription-schema";

type SubscriptionFormProps = {
  /**
   * Receives the validated subscription; the form waits for the returned promise. While it is pending
   * the fields are locked and further submissions are ignored. Resolving clears the form. Rejecting
   * keeps the draft: an error with fieldErrors shows them next to the fields, an error with a
   * formMessage shows that text (and its formLink), and any other error shows a retry message.
   */
  onSubmit: (subscription: NewSubscriptionInput) => void | Promise<void>;
  onCancel?: () => void;
  /** The id of the heading that names the form. */
  labelledBy?: string;
  /** The values the form starts with, such as a saved subscription when editing. */
  initialDraft?: SubscriptionDraft;
};

const EMPTY_DRAFT: SubscriptionDraft = { name: "", amount: "", billingCycle: "monthly", firstBillingDate: "" };

const RETRY_MESSAGE = "Couldn’t save this subscription. Your entries are still here. Select “Save subscription” to try again.";

type SaveError = { message: string; link?: { href: string; label: string } };

function saveErrorFromRejection(error: unknown): SaveError {
  if (typeof error !== "object" || error === null || !("formMessage" in error)) return { message: RETRY_MESSAGE };
  const { formMessage, formLink } = error as { formMessage: unknown; formLink?: { href?: unknown; label?: unknown } };
  if (typeof formMessage !== "string" || formMessage.trim() === "") return { message: RETRY_MESSAGE };
  const link =
    typeof formLink?.href === "string" && typeof formLink.label === "string" ? { href: formLink.href, label: formLink.label } : undefined;
  return { message: formMessage, link };
}

/** The input to focus for a field; for the billing cycle, the chosen option. */
function focusTarget(form: HTMLFormElement, field: SubscriptionField): HTMLInputElement | null {
  if (field === "billingCycle") {
    return form.querySelector<HTMLInputElement>('input[name="billingCycle"]:checked') ?? form.querySelector('input[name="billingCycle"]');
  }
  const element = form.elements.namedItem(field);
  return element instanceof HTMLInputElement ? element : null;
}

/** The next charge for the entered anchor and cycle (#8), on the user's local date, as a short line. */
function NextChargePreview({ draft }: { draft: SubscriptionDraft }) {
  const today = useLocalToday();
  const anchor = draft.firstBillingDate.trim();
  const cycle = BILLING_CYCLES.find((candidate) => candidate === draft.billingCycle);
  if (!today || !cycle || !isValidDateOnly(anchor)) {
    return <p className="-mt-2 mb-5 text-sm text-muted">Next charge: enter a first billing date to see it.</p>;
  }
  const next = nextBillingDate(anchor, cycle, today);
  return (
    <p className="-mt-2 mb-5 text-sm text-muted">
      Next charge: {formatDateOnly(next)} ({relativeDayText(daysUntil(next, today))})
    </p>
  );
}

/**
 * The add/edit subscription form (issue #7): Service name, Amount (USD), Billing cycle, and First
 * billing date, validated with the same rules as the subscription API.
 */
export function SubscriptionForm({ onSubmit, onCancel, labelledBy, initialDraft }: SubscriptionFormProps) {
  const [draft, setDraft] = useState<SubscriptionDraft>(initialDraft ?? EMPTY_DRAFT);
  const [errors, setErrors] = useState<SubscriptionFieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const savingRef = useRef(false);

  function check(next: SubscriptionDraft, form: HTMLFormElement | null): { input: NewSubscriptionInput | null; errors: SubscriptionFieldErrors } {
    const result = validateSubscriptionDraft(next);
    const fieldErrors: SubscriptionFieldErrors = result.success ? {} : { ...result.fieldErrors };
    // Browsers report a partly typed date as an empty value; call it incomplete, not missing.
    const dateInput = form?.elements.namedItem("firstBillingDate");
    if (dateInput instanceof HTMLInputElement && dateInput.validity.badInput) fieldErrors.firstBillingDate = INVALID_DATE_MESSAGE;
    const valid = result.success && Object.keys(fieldErrors).length === 0;
    return { input: valid ? result.data : null, errors: fieldErrors };
  }

  function showErrors(fieldErrors: SubscriptionFieldErrors, form: HTMLFormElement) {
    setErrors(fieldErrors);
    const firstInvalid = SUBSCRIPTION_FIELDS.find((field) => fieldErrors[field]);
    if (firstInvalid) focusTarget(form, firstInvalid)?.focus();
  }

  function handleChange(field: SubscriptionField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const next = { ...draft, [field]: event.target.value };
      setDraft(next);
      if (attempted) setErrors(check(next, event.target.form).errors);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;

    setAttempted(true);
    setSaveError(null);
    const form = event.currentTarget;
    const { input, errors: fieldErrors } = check(draft, form);
    showErrors(fieldErrors, form);
    if (!input) return;

    savingRef.current = true;
    setSaving(true);
    try {
      await onSubmit(input);
      setDraft(EMPTY_DRAFT);
      setAttempted(false);
    } catch (error) {
      const rejected = subscriptionFieldErrorsFromRejection(error);
      if (rejected) showErrors(rejected, form);
      else setSaveError(saveErrorFromRejection(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function fieldProps(field: "name" | "amount" | "firstBillingDate") {
    return {
      id: `subscription-${field}`,
      name: field,
      value: draft[field],
      error: errors[field],
      readOnly: saving,
      onChange: handleChange(field),
    };
  }

  const errorCount = Object.keys(errors).length;
  const cycleErrorId = "subscription-billingCycle-error";

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={labelledBy}
      aria-busy={saving}
      className="max-w-[46rem] rounded-card border border-line bg-surface p-[1.125rem] shadow-card sm:p-6"
    >
      {errorCount > 0 ? (
        <p className="mb-4 font-semibold text-urgent">
          Fix {errorCount} {errorCount === 1 ? "field" : "fields"} to save this subscription.
        </p>
      ) : null}
      {saveError ? (
        <div role="alert" className="mb-4 rounded-control border border-urgent-line bg-urgent-soft px-4 py-3">
          {saveError.message}
          {saveError.link ? (
            <>
              {" "}
              <Link href={saveError.link.href} className="font-semibold text-accent underline underline-offset-[3px]">
                {saveError.link.label}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <FormField {...fieldProps("name")} label="Service name" required type="text" spellCheck={false} hint="Up to 100 characters." />
      <FormField
        {...fieldProps("amount")}
        label="Amount (USD)"
        required
        type="text"
        size="money"
        inputMode="decimal"
        hint="The amount of each charge, up to two decimal places, like 15.99. Use 0 for a free plan."
      />

      <fieldset className="mb-5 min-w-0" aria-describedby={errors.billingCycle ? cycleErrorId : undefined}>
        <legend className="font-semibold">
          Billing cycle <span className="text-sm font-normal text-muted">(required)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BILLING_CYCLES.map((cycle) => (
            <label
              key={cycle}
              className="inline-flex min-h-[2.625rem] cursor-pointer items-center gap-2 rounded-control border border-line-strong bg-surface px-3 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="billingCycle"
                value={cycle}
                checked={draft.billingCycle === cycle}
                disabled={saving}
                onChange={handleChange("billingCycle")}
                className="accent-accent"
              />
              {BILLING_CYCLE_LABELS[cycle]}
            </label>
          ))}
        </div>
        {errors.billingCycle ? (
          <p id={cycleErrorId} className="mt-1.5 text-sm font-semibold text-urgent">
            {errors.billingCycle}
          </p>
        ) : null}
      </fieldset>

      <FormField
        {...fieldProps("firstBillingDate")}
        label="First billing date"
        required
        type="date"
        size="date"
        hint="The date of the first charge; it may be in the future. Later charges repeat from this date."
      />
      <NextChargePreview draft={draft} />

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" variant="primary" aria-disabled={saving || undefined}>
          {saving ? "Saving…" : "Save subscription"}
        </Button>
        {/* The subscription is saved whatever happens next, so Cancel waits for the save too. */}
        <Button aria-disabled={saving || undefined} onClick={() => !savingRef.current && onCancel?.()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
