"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  INVALID_DATE_MESSAGE,
  INVALID_OPTIONAL_DATE_MESSAGE,
  ITEM_FIELDS,
  type ItemDraft,
  type ItemField,
  type ItemFieldErrors,
  type NewItemInput,
  fieldErrorsFromRejection,
  validateItemDraft,
} from "./item-schema";

type AddItemFormProps = {
  /**
   * Returns the user's local calendar date (YYYY-MM-DD); purchase dates cannot be later. The form
   * calls it at every validation, so a page left open past midnight uses the new date.
   */
  getToday: () => string;
  /**
   * Receives the validated item; the form waits for the returned promise. While it is pending the
   * fields are read-only and further submissions are ignored. Resolving clears the form. Rejecting
   * keeps the draft: an ItemSubmitError (or any error with fieldErrors) shows its messages next to
   * the fields, an error with a formMessage string shows that text (with a formLink { href, label }
   * after it, if given), and any other error shows a retry message.
   */
  onSubmit: (item: NewItemInput) => void | Promise<void>;
  onCancel?: () => void;
  /** The id of the heading that names the form. */
  labelledBy?: string;
  /** The values the form starts with, such as a saved item when editing; empty when omitted. */
  initialDraft?: ItemDraft;
};

const EMPTY_DRAFT: ItemDraft = {
  name: "",
  purchaseDate: "",
  price: "",
  returnDeadline: "",
  warrantyExpiration: "",
};

const DATE_FIELDS = ["purchaseDate", "returnDeadline", "warrantyExpiration"] as const;

const RETRY_MESSAGE = "Couldn’t save this item. Your entries are still here. Select “Save item” to try again.";

type SaveError = { message: string; link?: { href: string; label: string } };

function saveErrorFromRejection(error: unknown): SaveError {
  if (typeof error !== "object" || error === null || !("formMessage" in error)) return { message: RETRY_MESSAGE };
  const { formMessage, formLink } = error as { formMessage: unknown; formLink?: { href?: unknown; label?: unknown } };
  if (typeof formMessage !== "string" || formMessage.trim() === "") return { message: RETRY_MESSAGE };
  const link =
    typeof formLink?.href === "string" && typeof formLink.label === "string"
      ? { href: formLink.href, label: formLink.label }
      : undefined;
  return { message: formMessage, link };
}

type FormCheck = { item: NewItemInput | null; errors: ItemFieldErrors };

function fieldInput(form: HTMLFormElement | null, field: ItemField): HTMLInputElement | null {
  const element = form?.elements.namedItem(field);
  return element instanceof HTMLInputElement ? element : null;
}

export function AddItemForm({ getToday, onSubmit, onCancel, labelledBy, initialDraft }: AddItemFormProps) {
  const [draft, setDraft] = useState<ItemDraft>(initialDraft ?? EMPTY_DRAFT);
  const [errors, setErrors] = useState<ItemFieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const savingRef = useRef(false);

  function check(next: ItemDraft, form: HTMLFormElement | null): FormCheck {
    const result = validateItemDraft(next, getToday());
    const fieldErrors: ItemFieldErrors = result.success ? {} : { ...result.fieldErrors };
    // Browsers report a partly typed date as an empty value; call it incomplete, not missing.
    for (const field of DATE_FIELDS) {
      if (fieldInput(form, field)?.validity.badInput) {
        fieldErrors[field] = field === "purchaseDate" ? INVALID_DATE_MESSAGE : INVALID_OPTIONAL_DATE_MESSAGE;
      }
    }
    const valid = result.success && Object.keys(fieldErrors).length === 0;
    return { item: valid ? result.data : null, errors: fieldErrors };
  }

  function showErrors(fieldErrors: ItemFieldErrors, form: HTMLFormElement) {
    setErrors(fieldErrors);
    const firstInvalid = ITEM_FIELDS.find((field) => fieldErrors[field]);
    if (firstInvalid) fieldInput(form, firstInvalid)?.focus();
  }

  function handleChange(field: ItemField) {
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
    const { item, errors: fieldErrors } = check(draft, form);
    showErrors(fieldErrors, form);
    if (!item) return;

    savingRef.current = true;
    setSaving(true);
    try {
      await onSubmit(item);
      setDraft(EMPTY_DRAFT);
      setAttempted(false);
    } catch (error) {
      const rejected = fieldErrorsFromRejection(error);
      if (rejected) showErrors(rejected, form);
      else setSaveError(saveErrorFromRejection(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function fieldProps(field: ItemField) {
    return {
      id: `item-${field}`,
      name: field,
      value: draft[field],
      error: errors[field],
      readOnly: saving,
      onChange: handleChange(field),
    };
  }

  const errorCount = Object.keys(errors).length;

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
          Fix {errorCount} {errorCount === 1 ? "field" : "fields"} to save this item.
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

      <FormField {...fieldProps("name")} label="Name" required type="text" spellCheck={false} hint="Up to 100 characters." />
      <FormField
        {...fieldProps("purchaseDate")}
        label="Purchase date"
        required
        type="date"
        size="date"
        max={getToday()}
        hint="Today or earlier."
      />
      <FormField
        {...fieldProps("price")}
        label="Price (USD)"
        type="text"
        size="money"
        inputMode="decimal"
        hint="Up to two decimal places, like 49.99. Leave blank if unknown; 0 means it was free."
      />
      <FormField
        {...fieldProps("returnDeadline")}
        label="Return deadline"
        type="date"
        size="date"
        hint="On or after the purchase date."
      />
      <FormField
        {...fieldProps("warrantyExpiration")}
        label="Warranty expiration"
        type="date"
        size="date"
        hint="On or after the purchase date."
      />

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" variant="primary" aria-disabled={saving || undefined}>
          {saving ? "Saving…" : "Save item"}
        </Button>
        {/* The item is saved whatever happens next, so Cancel waits for the save like Save item does. */}
        <Button aria-disabled={saving || undefined} onClick={() => !savingRef.current && onCancel?.()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
