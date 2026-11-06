import { fieldErrorsFromRejection, ItemSubmitError, validateNewItem } from "./item-schema";

const today = "2026-10-23";

const valid = {
  name: "  Wool coat ",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
};

function errorsFor(payload: unknown) {
  const result = validateNewItem(payload, today);
  if (result.success) throw new Error("Expected validation to fail");
  return result.fieldErrors;
}

// The JSON body the item API (#4) receives: the form's NewItemInput, checked again on the server.
describe("validateNewItem", () => {
  it("accepts a valid payload, trims the name, and drops unknown fields", () => {
    const result = validateNewItem({ ...valid, ownerId: "someone-else" }, today);
    expect(result).toEqual({
      success: true,
      data: { ...valid, name: "Wool coat" },
    });
  });

  it("treats a missing optional field as null and keeps zero distinct from null", () => {
    const result = validateNewItem({ name: "Gift card", purchaseDate: "2026-10-23", priceCents: 0 }, today);
    expect(result).toEqual({
      success: true,
      data: { name: "Gift card", purchaseDate: "2026-10-23", priceCents: 0, returnDeadline: null, warrantyExpiration: null },
    });
  });

  it("applies the same name and date rules as the form", () => {
    expect(errorsFor({ ...valid, name: "   " })).toEqual({ name: "Enter a name." });
    expect(errorsFor({ ...valid, name: "x".repeat(101) })).toEqual({
      name: "Use 100 characters or fewer. This one has 101.",
    });
    expect(errorsFor({ ...valid, purchaseDate: "2026-10-24" })).toEqual({
      purchaseDate: "Purchase date can’t be in the future.",
    });
    expect(errorsFor({ ...valid, purchaseDate: "2026-02-30" })).toEqual({ purchaseDate: "Enter a complete, real date." });
    expect(errorsFor({ ...valid, returnDeadline: "2026-10-08" })).toEqual({
      returnDeadline: "Return deadline can’t be before the purchase date, Oct 9, 2026.",
    });
  });

  it("requires integer, nonnegative cents or null for the price", () => {
    expect(errorsFor({ ...valid, priceCents: 49.99 })).toEqual({ priceCents: "Enter a price like 49.99, or leave it blank." });
    expect(errorsFor({ ...valid, priceCents: -1 })).toEqual({ priceCents: "Price can’t be negative." });
    expect(errorsFor({ ...valid, priceCents: "1899" })).toEqual({ priceCents: "Enter a price like 49.99, or leave it blank." });
    expect(errorsFor({ ...valid, priceCents: Number.MAX_SAFE_INTEGER + 1 })).toEqual({ priceCents: "Enter a smaller amount." });
  });

  // Larger values would overflow the integer price_cents column and fail with a server error (#4).
  it("accepts at most 99999999 cents ($999,999.99)", () => {
    expect(validateNewItem({ ...valid, priceCents: 99_999_999 }, today).success).toBe(true);
    expect(errorsFor({ ...valid, priceCents: 100_000_000 })).toEqual({ priceCents: "Enter a smaller amount." });
    expect(errorsFor({ ...valid, priceCents: 2_147_483_648 })).toEqual({ priceCents: "Enter a smaller amount." });
  });

  it("rejects a body that is not an object, naming every required field", () => {
    expect(Object.keys(errorsFor(null)).sort()).toEqual(["name", "purchaseDate"]);
    expect(Object.keys(errorsFor([])).sort()).toEqual(["name", "purchaseDate"]);
  });

  it("rejects non-string dates and names", () => {
    expect(errorsFor({ ...valid, name: 42, purchaseDate: 20261009, warrantyExpiration: true })).toEqual({
      name: "Enter a name.",
      purchaseDate: "Enter the purchase date.",
      warrantyExpiration: "Enter a complete, real date, or clear the field.",
    });
  });
});

describe("fieldErrorsFromRejection", () => {
  it("reads the messages of an ItemSubmitError", () => {
    expect(fieldErrorsFromRejection(new ItemSubmitError({ name: "Enter a name." }))).toEqual({ name: "Enter a name." });
  });

  it("maps the API's priceCents errors to the form's price field", () => {
    const rejection = { fieldErrors: { priceCents: "Price can’t be negative.", purchaseDate: "Enter the purchase date." } };
    expect(fieldErrorsFromRejection(rejection)).toEqual({
      price: "Price can’t be negative.",
      purchaseDate: "Enter the purchase date.",
    });
  });

  it("ignores rejections without usable field messages", () => {
    expect(fieldErrorsFromRejection(new Error("Network down"))).toBeNull();
    expect(fieldErrorsFromRejection("offline")).toBeNull();
    expect(fieldErrorsFromRejection({ fieldErrors: null })).toBeNull();
    expect(fieldErrorsFromRejection({ fieldErrors: { ownerId: "Forbidden", name: 3, price: "  " } })).toBeNull();
  });
});
