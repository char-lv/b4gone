import { z } from "zod";
import { formatDateOnly, isValidDateOnly } from "@/lib/dates";
import { MAX_AMOUNT_CENTS, type MoneyErrorCode, type MoneyParseResult, formatUsd, parseUsdToCents } from "@/lib/money";

export const ITEM_NAME_MAX = 100;

/** Raw text entered in the add/edit item form. */
export type ItemDraft = {
  name: string;
  purchaseDate: string;
  price: string;
  returnDeadline: string;
  warrantyExpiration: string;
};

export type ItemField = keyof ItemDraft;

/** A validated new item: trimmed name, date-only strings, and integer cents. */
export type NewItemInput = {
  name: string;
  purchaseDate: string;
  priceCents: number | null;
  returnDeadline: string | null;
  warrantyExpiration: string | null;
};

export type ItemFieldErrors = Partial<Record<ItemField, string>>;

export type ItemValidationResult =
  | { success: true; data: NewItemInput }
  | { success: false; fieldErrors: ItemFieldErrors };

export const ITEM_FIELDS: readonly ItemField[] = [
  "name",
  "purchaseDate",
  "price",
  "returnDeadline",
  "warrantyExpiration",
];

const PRICE_ERRORS: Record<MoneyErrorCode, string> = {
  negative: "Price can’t be negative.",
  symbols: "Use digits only, like 1299.99, without $ or commas.",
  decimals: "Use no more than two decimal places.",
  too_large: `Enter an amount up to ${formatUsd(MAX_AMOUNT_CENTS)}.`,
  format: "Enter a price like 49.99, or leave it blank.",
};

const DEADLINE_LABELS = {
  returnDeadline: "Return deadline",
  warrantyExpiration: "Warranty expiration",
} as const;

export const INVALID_DATE_MESSAGE = "Enter a complete, real date.";
export const INVALID_OPTIONAL_DATE_MESSAGE = "Enter a complete, real date, or clear the field.";

function nameError(raw: string): string | undefined {
  // Count code points so an emoji counts as one character.
  const length = Array.from(raw.trim()).length;
  // trim() keeps format characters such as U+200B, so a name needs at least one visible character.
  if (!/[^\p{Cf}\p{Z}\s]/u.test(raw)) return "Enter a name.";
  // A name is one line (no Cc controls or U+2028/U+2029 separators), and PostgreSQL text cannot store U+0000.
  if (/[\p{Cc}\p{Zl}\p{Zp}]/u.test(raw.trim())) return "Remove tabs, line breaks, and other control characters.";
  if (length > ITEM_NAME_MAX) {
    return `Use ${ITEM_NAME_MAX} characters or fewer. This one has ${length}.`;
  }
  return undefined;
}

function purchaseDateError(value: string, today: string): string | undefined {
  if (value === "") return "Enter the purchase date.";
  if (!isValidDateOnly(value)) return INVALID_DATE_MESSAGE;
  if (value > today) return "Purchase date can’t be in the future.";
  return undefined;
}

function deadlineError(
  field: keyof typeof DEADLINE_LABELS,
  value: string,
  validPurchaseDate: string | null,
): string | undefined {
  if (value === "") return undefined;
  if (!isValidDateOnly(value)) return INVALID_OPTIONAL_DATE_MESSAGE;
  if (validPurchaseDate && value < validPurchaseDate) {
    return `${DEADLINE_LABELS[field]} can’t be before the purchase date, ${formatDateOnly(validPurchaseDate)}.`;
  }
  return undefined;
}

/**
 * The shared item draft schema for the form and, later, the item API.
 * `today` is the user's local calendar date (YYYY-MM-DD), injected by the caller.
 */
export function createItemDraftSchema(today: string) {
  return z
    .object({
      name: z.string(),
      purchaseDate: z.string().trim(),
      price: z.string(),
      returnDeadline: z.string().trim(),
      warrantyExpiration: z.string().trim(),
    })
    .superRefine((draft, ctx) => {
      const purchaseError = purchaseDateError(draft.purchaseDate, today);
      const validPurchaseDate = purchaseError ? null : draft.purchaseDate;
      const price = parseUsdToCents(draft.price);
      const errors: ItemFieldErrors = {
        name: nameError(draft.name),
        purchaseDate: purchaseError,
        price: price.ok ? undefined : PRICE_ERRORS[price.code],
        returnDeadline: deadlineError("returnDeadline", draft.returnDeadline, validPurchaseDate),
        warrantyExpiration: deadlineError(
          "warrantyExpiration",
          draft.warrantyExpiration,
          validPurchaseDate,
        ),
      };
      for (const field of ITEM_FIELDS) {
        const message = errors[field];
        if (message) ctx.addIssue({ code: "custom", path: [field], message });
      }
    })
    .transform((draft): NewItemInput => {
      const price = parseUsdToCents(draft.price);
      return {
        name: draft.name.trim(),
        purchaseDate: draft.purchaseDate,
        priceCents: price.ok ? price.cents : null,
        returnDeadline: draft.returnDeadline || null,
        warrantyExpiration: draft.warrantyExpiration || null,
      };
    });
}

/** A saved item as edit-form text (issue #5). */
export function draftFromItem(item: NewItemInput): ItemDraft {
  throw new Error("Not implemented");
}

export function validateItemDraft(draft: ItemDraft, today: string): ItemValidationResult {
  const result = createItemDraftSchema(today).safeParse(draft);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: ItemFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && ITEM_FIELDS.includes(field as ItemField)) {
      fieldErrors[field as ItemField] ??= issue.message;
    }
  }
  return { success: false, fieldErrors };
}

/**
 * Reject an AddItemForm onSubmit with this error to show messages next to form fields, for example
 * when the item API rejects a value. Other rejections show the generic retry message.
 */
export class ItemSubmitError extends Error {
  readonly fieldErrors: ItemFieldErrors;

  constructor(fieldErrors: ItemFieldErrors, message = "The item was not saved.") {
    super(message);
    this.name = "ItemSubmitError";
    this.fieldErrors = fieldErrors;
  }
}

/** Field messages carried by a rejected save, or null. Only known fields with text are kept. */
export function fieldErrorsFromRejection(error: unknown): ItemFieldErrors | null {
  if (typeof error !== "object" || error === null || !("fieldErrors" in error)) return null;
  const candidate = (error as { fieldErrors: unknown }).fieldErrors;
  if (typeof candidate !== "object" || candidate === null) return null;

  const messages = candidate as Record<string, unknown>;
  const fieldErrors: ItemFieldErrors = {};
  for (const field of ITEM_FIELDS) {
    // The API names the price field priceCents (see validateNewItem); the form calls it price.
    const message = field === "price" ? (messages.price ?? messages.priceCents) : messages[field];
    if (typeof message === "string" && message.trim() !== "") fieldErrors[field] = message;
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export type NewItemField = keyof NewItemInput;
export type NewItemFieldErrors = Partial<Record<NewItemField, string>>;
export type NewItemValidationResult =
  | { success: true; data: NewItemInput }
  | { success: false; fieldErrors: NewItemFieldErrors };

/**
 * Validates an item API request body (a NewItemInput sent as JSON) with the form's rules.
 * `today` is the user's local calendar date, computed on the server from the user's time zone.
 */
export function validateNewItem(payload: unknown, today: string): NewItemValidationResult {
  const body: Record<string, unknown> =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const name = typeof body.name === "string" ? body.name : "";
  const purchaseDate = typeof body.purchaseDate === "string" ? body.purchaseDate.trim() : "";
  const purchaseError = purchaseDateError(purchaseDate, today);
  const validPurchaseDate = purchaseError ? null : purchaseDate;
  const returnDeadline = optionalDate(body.returnDeadline);
  const warrantyExpiration = optionalDate(body.warrantyExpiration);
  const price = centsResult(body.priceCents);

  const errors: NewItemFieldErrors = {
    name: nameError(name),
    purchaseDate: purchaseError,
    priceCents: price.ok ? undefined : PRICE_ERRORS[price.code],
    returnDeadline:
      returnDeadline === undefined
        ? INVALID_OPTIONAL_DATE_MESSAGE
        : deadlineError("returnDeadline", returnDeadline ?? "", validPurchaseDate),
    warrantyExpiration:
      warrantyExpiration === undefined
        ? INVALID_OPTIONAL_DATE_MESSAGE
        : deadlineError("warrantyExpiration", warrantyExpiration ?? "", validPurchaseDate),
  };
  const fieldErrors = Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as NewItemFieldErrors;
  if (Object.keys(fieldErrors).length > 0 || !price.ok) return { success: false, fieldErrors };

  return {
    success: true,
    data: {
      name: name.trim(),
      purchaseDate,
      priceCents: price.cents,
      returnDeadline: returnDeadline || null,
      warrantyExpiration: warrantyExpiration || null,
    },
  };
}

/** A trimmed date string, null when absent or blank, or undefined when the value is not a string. */
function optionalDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

/** Checks stored cents the way parseUsdToCents checks typed text. */
function centsResult(value: unknown): MoneyParseResult {
  if (value === null || value === undefined) return { ok: true, cents: null };
  if (typeof value !== "number" || !Number.isFinite(value)) return { ok: false, code: "format" };
  if (value < 0) return { ok: false, code: "negative" };
  if (!Number.isInteger(value)) return { ok: false, code: "format" };
  if (value > MAX_AMOUNT_CENTS) return { ok: false, code: "too_large" };
  return { ok: true, cents: value };
}
