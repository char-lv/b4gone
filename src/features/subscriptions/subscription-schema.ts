// Shared subscription validation for the add/edit form and the subscription API (issue #7, PRD
// Section 3). Unlike an item's purchase date, a first billing date may be in the future, so these
// rules never need today.
import { isValidDateOnly } from "@/lib/dates";
import {
  MAX_AMOUNT_CENTS,
  type MoneyErrorCode,
  type MoneyParseResult,
  centsToInput,
  formatUsd,
  parseStoredCents,
  parseUsdToCents,
} from "@/lib/money";
import { recordNameError } from "@/lib/record-name";
import type { BillingCycle } from "@/lib/recurrence";

export const BILLING_CYCLES: readonly BillingCycle[] = ["monthly", "yearly"];

/** Raw values entered in the add/edit subscription form. */
export type SubscriptionDraft = {
  name: string;
  amount: string;
  billingCycle: string;
  firstBillingDate: string;
};

export type SubscriptionField = keyof SubscriptionDraft;
export type SubscriptionFieldErrors = Partial<Record<SubscriptionField, string>>;

export const SUBSCRIPTION_FIELDS: readonly SubscriptionField[] = ["name", "amount", "billingCycle", "firstBillingDate"];

/** A validated subscription: trimmed name, integer cents, a cycle, and the date-only billing anchor. */
export type NewSubscriptionInput = {
  name: string;
  amountCents: number;
  billingCycle: BillingCycle;
  firstBillingDate: string;
};

export type NewSubscriptionField = keyof NewSubscriptionInput;
export type NewSubscriptionFieldErrors = Partial<Record<NewSubscriptionField, string>>;

export type SubscriptionValidationResult =
  | { success: true; data: NewSubscriptionInput }
  | { success: false; fieldErrors: SubscriptionFieldErrors };

export type NewSubscriptionValidationResult =
  | { success: true; data: NewSubscriptionInput }
  | { success: false; fieldErrors: NewSubscriptionFieldErrors };

export const INVALID_DATE_MESSAGE = "Enter a complete, real date.";

const AMOUNT_REQUIRED_MESSAGE = "Enter the amount. Use 0 for a free plan.";

const AMOUNT_ERRORS: Record<MoneyErrorCode, string> = {
  negative: "Amount can’t be negative.",
  symbols: "Use digits only, like 15.99, without $ or commas.",
  decimals: "Use no more than two decimal places.",
  too_large: `Enter an amount up to ${formatUsd(MAX_AMOUNT_CENTS)}.`,
  format: "Enter an amount like 15.99.",
};

type Checked = { name: string; amount: MoneyParseResult; billingCycle: unknown; firstBillingDate: string };
type CheckedErrors = { name?: string; amount?: string; billingCycle?: string; firstBillingDate?: string };

function amountError(amount: MoneyParseResult): string | undefined {
  if (!amount.ok) return AMOUNT_ERRORS[amount.code];
  return amount.cents === null ? AMOUNT_REQUIRED_MESSAGE : undefined;
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return BILLING_CYCLES.some((cycle) => cycle === value);
}

function firstBillingDateError(value: string): string | undefined {
  if (value === "") return "Enter the first billing date.";
  return isValidDateOnly(value) ? undefined : INVALID_DATE_MESSAGE;
}

/** The one set of subscription rules; the form and the API differ only in how values arrive. */
function check(values: Checked): { errors: CheckedErrors; data: NewSubscriptionInput | null } {
  const errors: CheckedErrors = {
    name: recordNameError(values.name, "Enter a service name."),
    amount: amountError(values.amount),
    billingCycle: isBillingCycle(values.billingCycle) ? undefined : "Choose monthly or yearly.",
    firstBillingDate: firstBillingDateError(values.firstBillingDate),
  };
  const valid = Object.values(errors).every((message) => message === undefined);
  if (!valid || !values.amount.ok || values.amount.cents === null || !isBillingCycle(values.billingCycle)) {
    return { errors, data: null };
  }
  return {
    errors,
    data: {
      name: values.name.trim(),
      amountCents: values.amount.cents,
      billingCycle: values.billingCycle,
      firstBillingDate: values.firstBillingDate,
    },
  };
}

function definedOnly<T extends Record<string, string | undefined>>(errors: T): Partial<Record<keyof T, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== undefined)) as Partial<
    Record<keyof T, string>
  >;
}

/** Validates the form's text. */
export function validateSubscriptionDraft(draft: SubscriptionDraft): SubscriptionValidationResult {
  const { errors, data } = check({
    name: draft.name,
    amount: parseUsdToCents(draft.amount),
    billingCycle: draft.billingCycle,
    firstBillingDate: draft.firstBillingDate.trim(),
  });
  return data ? { success: true, data } : { success: false, fieldErrors: definedOnly(errors) };
}

/** Validates a subscription API request body (a NewSubscriptionInput sent as JSON) with the form's rules. */
export function validateNewSubscription(payload: unknown): NewSubscriptionValidationResult {
  const body: Record<string, unknown> =
    typeof payload === "object" && payload !== null && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  const { errors, data } = check({
    name: typeof body.name === "string" ? body.name : "",
    amount: parseStoredCents(body.amountCents),
    billingCycle: body.billingCycle,
    firstBillingDate: typeof body.firstBillingDate === "string" ? body.firstBillingDate.trim() : "",
  });
  if (data) return { success: true, data };
  const { amount, ...rest } = errors;
  return { success: false, fieldErrors: definedOnly({ name: rest.name, amountCents: amount, billingCycle: rest.billingCycle, firstBillingDate: rest.firstBillingDate }) };
}

/** A saved subscription as edit-form text. */
export function draftFromSubscription(subscription: NewSubscriptionInput): SubscriptionDraft {
  return {
    name: subscription.name,
    amount: centsToInput(subscription.amountCents),
    billingCycle: subscription.billingCycle,
    firstBillingDate: subscription.firstBillingDate,
  };
}

/** Reject a SubscriptionForm onSubmit with this error to show messages next to the form fields. */
export class SubscriptionSubmitError extends Error {
  readonly fieldErrors: SubscriptionFieldErrors;

  constructor(fieldErrors: SubscriptionFieldErrors, message = "The subscription was not saved.") {
    super(message);
    this.name = "SubscriptionSubmitError";
    this.fieldErrors = fieldErrors;
  }
}

/** Field messages carried by a rejected save, or null. The API's amountCents becomes the form's amount. */
export function subscriptionFieldErrorsFromRejection(error: unknown): SubscriptionFieldErrors | null {
  if (typeof error !== "object" || error === null || !("fieldErrors" in error)) return null;
  const candidate = (error as { fieldErrors: unknown }).fieldErrors;
  if (typeof candidate !== "object" || candidate === null) return null;

  const messages = candidate as Record<string, unknown>;
  const fieldErrors: SubscriptionFieldErrors = {};
  for (const field of SUBSCRIPTION_FIELDS) {
    const message = field === "amount" ? (messages.amount ?? messages.amountCents) : messages[field];
    if (typeof message === "string" && message.trim() !== "") fieldErrors[field] = message;
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}
