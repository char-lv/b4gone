import { type ItemDraft, draftFromItem, validateItemDraft } from "./item-schema";

const today = "2026-10-23";

function draft(overrides: Partial<ItemDraft> = {}): ItemDraft {
  return {
    name: "Wool coat",
    purchaseDate: "2026-10-09",
    price: "",
    returnDeadline: "",
    warrantyExpiration: "",
    ...overrides,
  };
}

function errorsFor(overrides: Partial<ItemDraft>) {
  const result = validateItemDraft(draft(overrides), today);
  if (result.success) throw new Error("Expected validation to fail");
  return result.fieldErrors;
}

describe("validateItemDraft", () => {
  it("returns a trimmed item with null optional fields", () => {
    expect(validateItemDraft(draft({ name: "  Wool coat  " }), today)).toEqual({
      success: true,
      data: {
        name: "Wool coat",
        purchaseDate: "2026-10-09",
        priceCents: null,
        returnDeadline: null,
        warrantyExpiration: null,
      },
    });
  });

  it("keeps zero price distinct from a blank price", () => {
    const result = validateItemDraft(draft({ price: "0" }), today);
    expect(result).toMatchObject({ success: true, data: { priceCents: 0 } });
  });

  it("converts price to integer cents and keeps optional dates", () => {
    const result = validateItemDraft(
      draft({ price: "189.50", returnDeadline: "2026-11-08", warrantyExpiration: "2027-10-09" }),
      today,
    );
    expect(result).toMatchObject({
      success: true,
      data: { priceCents: 18950, returnDeadline: "2026-11-08", warrantyExpiration: "2027-10-09" },
    });
  });

  describe("name", () => {
    it("requires a name after trimming", () => {
      expect(errorsFor({ name: "" }).name).toBe("Enter a name.");
      expect(errorsFor({ name: "   " }).name).toBe("Enter a name.");
    });

    it("accepts 1 and 100 characters after trimming", () => {
      expect(validateItemDraft(draft({ name: " a " }), today).success).toBe(true);
      expect(validateItemDraft(draft({ name: ` ${"a".repeat(100)} ` }), today).success).toBe(true);
    });

    it("rejects 101 characters after trimming", () => {
      expect(errorsFor({ name: "a".repeat(101) }).name).toBe(
        "Use 100 characters or fewer. This one has 101.",
      );
    });

    it("counts an emoji as one character", () => {
      expect(validateItemDraft(draft({ name: "🎁".repeat(100) }), today).success).toBe(true);
    });

    // PostgreSQL text cannot hold U+0000, and a name is a single line.
    it.each(["Coat\u0000", "Wool\tcoat", "Wool\ncoat", "Wool\u007fcoat", "Wool\u2028coat", "Wool\u2029coat"])("rejects the control character in %j", (name) => {
      expect(errorsFor({ name }).name).toBe("Remove tabs, line breaks, and other control characters.");
    });

    // trim() keeps format characters such as U+200B, so these names would show as blank.
    it.each(["\u200B", "\u200B\u200D\u2060", " \uFEFF ", "\u00A0\u200B"])("treats the invisible name %j as empty", (name) => {
      expect(errorsFor({ name }).name).toBe("Enter a name.");
    });

    it("keeps names that contain visible characters next to format characters", () => {
      expect(validateItemDraft(draft({ name: "👩\u200D💻 laptop" }), today).success).toBe(true);
      expect(validateItemDraft(draft({ name: "Wool\u200Bcoat" }), today).success).toBe(true);
    });

    it("still trims surrounding whitespace such as a trailing line break", () => {
      expect(validateItemDraft(draft({ name: "Wool coat\n" }), today).success).toBe(true);
    });
  });

  describe("purchase date", () => {
    it("is required", () => {
      expect(errorsFor({ purchaseDate: "" }).purchaseDate).toBe("Enter the purchase date.");
    });

    it("rejects dates that do not exist", () => {
      expect(errorsFor({ purchaseDate: "2026-02-29" }).purchaseDate).toBe(
        "Enter a complete, real date.",
      );
    });

    it("accepts today and a leap day", () => {
      expect(validateItemDraft(draft({ purchaseDate: today }), today).success).toBe(true);
      expect(validateItemDraft(draft({ purchaseDate: "2024-02-29" }), today).success).toBe(true);
    });

    it("rejects tomorrow", () => {
      expect(errorsFor({ purchaseDate: "2026-10-24" }).purchaseDate).toBe(
        "Purchase date can’t be in the future.",
      );
    });
  });

  describe("price", () => {
    it("accepts the largest amount, $999,999.99", () => {
      expect(validateItemDraft(draft({ price: "999999.99" }), today)).toMatchObject({
        success: true,
        data: { priceCents: 99999999 },
      });
    });

    it.each([
      ["-5", "Price can’t be negative."],
      ["$5", "Use digits only, like 1299.99, without $ or commas."],
      ["5.999", "Use no more than two decimal places."],
      ["five", "Enter a price like 49.99, or leave it blank."],
      ["99999999999999999", "Enter an amount up to $999,999.99."],
      ["1000000", "Enter an amount up to $999,999.99."],
    ])("rejects %j", (price, message) => {
      expect(errorsFor({ price }).price).toBe(message);
    });
  });

  describe.each([
    ["returnDeadline", "Return deadline"],
    ["warrantyExpiration", "Warranty expiration"],
  ] as const)("%s", (key, label) => {
    it("accepts the purchase date itself and later dates, including future ones", () => {
      expect(validateItemDraft(draft({ [key]: "2026-10-09" }), today).success).toBe(true);
      expect(validateItemDraft(draft({ [key]: "2030-01-01" }), today).success).toBe(true);
    });

    it("rejects a date before the purchase date", () => {
      expect(errorsFor({ [key]: "2026-10-08" })[key]).toBe(
        `${label} can’t be before the purchase date, Oct 9, 2026.`,
      );
    });

    it("rejects an invalid date", () => {
      expect(errorsFor({ [key]: "2026-11-31" })[key]).toBe(
        "Enter a complete, real date, or clear the field.",
      );
    });

    it("skips the comparison when the purchase date is invalid", () => {
      const errors = errorsFor({ purchaseDate: "", [key]: "2000-01-01" });
      expect(errors[key]).toBeUndefined();
    });
  });

  it("reports every invalid field at once", () => {
    const errors = errorsFor({
      name: "",
      purchaseDate: "2026-10-30",
      price: "1.234",
      returnDeadline: "2026-10-01",
    });
    expect(Object.keys(errors).sort()).toEqual(["name", "price", "purchaseDate"].sort());
  });

  it("rejects non-string input from untrusted callers", () => {
    const result = validateItemDraft({ ...draft(), name: 42 } as unknown as ItemDraft, today);
    expect(result.success).toBe(false);
  });
});

// Issue #5: the edit form opens with the saved values.
describe("draftFromItem", () => {
  it("turns a saved item into form text that validates back to the same item", () => {
    const item = {
      name: "Wool coat",
      purchaseDate: "2026-10-09",
      priceCents: 18950,
      returnDeadline: "2026-11-08",
      warrantyExpiration: null,
    };

    const draft = draftFromItem(item);

    expect(draft).toEqual({
      name: "Wool coat",
      purchaseDate: "2026-10-09",
      price: "189.50",
      returnDeadline: "2026-11-08",
      warrantyExpiration: "",
    });
    expect(validateItemDraft(draft, "2026-10-23")).toEqual({ success: true, data: item });
  });

  it("keeps a free item at 0.00 and an unknown price blank", () => {
    const item = { name: "Pen", purchaseDate: "2026-10-09", returnDeadline: null, warrantyExpiration: null };

    expect(draftFromItem({ ...item, priceCents: 0 }).price).toBe("0.00");
    expect(draftFromItem({ ...item, priceCents: null }).price).toBe("");
  });
});
