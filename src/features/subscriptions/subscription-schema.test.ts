import {
  type SubscriptionDraft,
  SubscriptionSubmitError,
  draftFromSubscription,
  subscriptionFieldErrorsFromRejection,
  validateNewSubscription,
  validateSubscriptionDraft,
} from "./subscription-schema";

function draft(overrides: Partial<SubscriptionDraft> = {}): SubscriptionDraft {
  return {
    name: "Streaming plan",
    amount: "15.99",
    billingCycle: "monthly",
    firstBillingDate: "2026-01-31",
    ...overrides,
  };
}

function draftErrors(overrides: Partial<SubscriptionDraft>) {
  const result = validateSubscriptionDraft(draft(overrides));
  if (result.success) throw new Error("Expected validation to fail");
  return result.fieldErrors;
}

const BODY = { name: "Streaming plan", amountCents: 1599, billingCycle: "monthly", firstBillingDate: "2026-01-31" };

function bodyErrors(overrides: Record<string, unknown>) {
  const result = validateNewSubscription({ ...BODY, ...overrides });
  if (result.success) throw new Error("Expected validation to fail");
  return result.fieldErrors;
}

describe("validateSubscriptionDraft", () => {
  it("returns a trimmed subscription with integer cents", () => {
    expect(validateSubscriptionDraft(draft({ name: "  Streaming plan ", amount: " 189.5 " }))).toEqual({
      success: true,
      data: { name: "Streaming plan", amountCents: 18950, billingCycle: "monthly", firstBillingDate: "2026-01-31" },
    });
  });

  describe("service name", () => {
    it("requires a name with a visible character", () => {
      expect(draftErrors({ name: "" }).name).toBe("Enter a service name.");
      expect(draftErrors({ name: "   " }).name).toBe("Enter a service name.");
      expect(draftErrors({ name: "​" }).name).toBe("Enter a service name.");
    });

    it("accepts 1 and 100 characters after trimming and rejects 101", () => {
      expect(validateSubscriptionDraft(draft({ name: " a " })).success).toBe(true);
      expect(validateSubscriptionDraft(draft({ name: ` ${"a".repeat(100)} ` })).success).toBe(true);
      expect(draftErrors({ name: "a".repeat(101) }).name).toBe("Use 100 characters or fewer. This one has 101.");
    });

    it("counts an emoji as one character", () => {
      expect(validateSubscriptionDraft(draft({ name: "🎵".repeat(100) })).success).toBe(true);
    });

    it("rejects line breaks and control characters", () => {
      expect(draftErrors({ name: "Music\nplan" }).name).toBe("Remove tabs, line breaks, and other control characters.");
      expect(draftErrors({ name: "Music plan" }).name).toBe("Remove tabs, line breaks, and other control characters.");
    });
  });

  describe("amount", () => {
    it("is required: blank is an error, and zero is a free plan", () => {
      expect(draftErrors({ amount: "" }).amount).toBe("Enter the amount. Use 0 for a free plan.");
      expect(draftErrors({ amount: "   " }).amount).toBe("Enter the amount. Use 0 for a free plan.");
      expect(validateSubscriptionDraft(draft({ amount: "0" }))).toMatchObject({ success: true, data: { amountCents: 0 } });
    });

    it("accepts up to two decimal places without rounding", () => {
      expect(validateSubscriptionDraft(draft({ amount: "9.9" }))).toMatchObject({ data: { amountCents: 990 } });
      expect(validateSubscriptionDraft(draft({ amount: "999999.99" }))).toMatchObject({ data: { amountCents: 99_999_999 } });
      expect(draftErrors({ amount: "15.999" }).amount).toBe("Use no more than two decimal places.");
    });

    it.each([
      ["-1", "Amount can’t be negative."],
      ["$15", "Use digits only, like 15.99, without $ or commas."],
      ["1,,2", "Use digits only, like 15.99, without $ or commas."],
      ["1,200", "Use digits only, like 15.99, without $ or commas."],
      ["15.", "Enter an amount like 15.99."],
      ["abc", "Enter an amount like 15.99."],
      ["1000000", "Enter an amount up to $999,999.99."],
    ])("rejects %s", (amount, message) => {
      expect(draftErrors({ amount }).amount).toBe(message);
    });
  });

  describe("billing cycle", () => {
    it("accepts monthly and yearly", () => {
      expect(validateSubscriptionDraft(draft({ billingCycle: "yearly" }))).toMatchObject({ data: { billingCycle: "yearly" } });
    });

    it.each(["", "weekly", "Monthly"])("rejects %j", (billingCycle) => {
      expect(draftErrors({ billingCycle }).billingCycle).toBe("Choose monthly or yearly.");
    });
  });

  describe("first billing date", () => {
    it("requires a date", () => {
      expect(draftErrors({ firstBillingDate: "" }).firstBillingDate).toBe("Enter the first billing date.");
    });

    it("accepts past, leap-day, and future dates: a plan can start later", () => {
      for (const firstBillingDate of ["2001-01-01", "2028-02-29", "2099-12-31"]) {
        expect(validateSubscriptionDraft(draft({ firstBillingDate })).success).toBe(true);
      }
    });

    it.each(["2026-02-29", "2026-04-31", "2026-1-5", "0000-01-01", "01/31/2026"])("rejects %s", (firstBillingDate) => {
      expect(draftErrors({ firstBillingDate }).firstBillingDate).toBe("Enter a complete, real date.");
    });
  });

  it("reports every invalid field at once", () => {
    expect(Object.keys(draftErrors({ name: "", amount: "", billingCycle: "", firstBillingDate: "" }))).toEqual([
      "name",
      "amount",
      "billingCycle",
      "firstBillingDate",
    ]);
  });
});

describe("validateNewSubscription", () => {
  it("returns the subscription with a trimmed name and ignores fields it does not own", () => {
    expect(validateNewSubscription({ ...BODY, name: " Streaming plan ", status: "cancelled", id: "x" })).toEqual({
      success: true,
      data: { name: "Streaming plan", amountCents: 1599, billingCycle: "monthly", firstBillingDate: "2026-01-31" },
    });
  });

  it("accepts a free plan and a future first billing date", () => {
    expect(validateNewSubscription({ ...BODY, amountCents: 0, firstBillingDate: "2099-02-28" }).success).toBe(true);
  });

  it.each([
    [undefined, "Enter the amount. Use 0 for a free plan."],
    [null, "Enter the amount. Use 0 for a free plan."],
    ["1599", "Enter an amount like 15.99."],
    [15.5, "Enter an amount like 15.99."],
    [Number.NaN, "Enter an amount like 15.99."],
    [-1, "Amount can’t be negative."],
    [100_000_000, "Enter an amount up to $999,999.99."],
  ])("rejects amountCents %j", (amountCents, message) => {
    expect(bodyErrors({ amountCents }).amountCents).toBe(message);
  });

  it("rejects an unknown cycle, a missing name, and an impossible or non-string date", () => {
    expect(bodyErrors({ billingCycle: "weekly" }).billingCycle).toBe("Choose monthly or yearly.");
    expect(bodyErrors({ name: 42 }).name).toBe("Enter a service name.");
    expect(bodyErrors({ firstBillingDate: "2026-02-30" }).firstBillingDate).toBe("Enter a complete, real date.");
    expect(bodyErrors({ firstBillingDate: 20260131 }).firstBillingDate).toBe("Enter the first billing date.");
  });

  it("treats a body that is not an object as empty", () => {
    for (const payload of [null, "text", ["Streaming plan"]]) {
      const result = validateNewSubscription(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(result.fieldErrors)).toEqual(["name", "amountCents", "billingCycle", "firstBillingDate"]);
      }
    }
  });
});

describe("draftFromSubscription", () => {
  it("turns a saved subscription into edit-form text", () => {
    expect(
      draftFromSubscription({ name: "Cloud storage", amountCents: 0, billingCycle: "yearly", firstBillingDate: "2024-02-29" }),
    ).toEqual({ name: "Cloud storage", amount: "0.00", billingCycle: "yearly", firstBillingDate: "2024-02-29" });
  });
});

describe("subscriptionFieldErrorsFromRejection", () => {
  it("maps the API's amountCents message to the form's amount field and keeps known fields only", () => {
    expect(
      subscriptionFieldErrorsFromRejection({ fieldErrors: { amountCents: "Amount can’t be negative.", name: "Enter a service name.", other: "x" } }),
    ).toEqual({ amount: "Amount can’t be negative.", name: "Enter a service name." });
  });

  it("reads a SubscriptionSubmitError and ignores errors without field messages", () => {
    expect(subscriptionFieldErrorsFromRejection(new SubscriptionSubmitError({ billingCycle: "Choose monthly or yearly." }))).toEqual({
      billingCycle: "Choose monthly or yearly.",
    });
    expect(subscriptionFieldErrorsFromRejection(new Error("offline"))).toBeNull();
    expect(subscriptionFieldErrorsFromRejection({ fieldErrors: { name: "  " } })).toBeNull();
    expect(subscriptionFieldErrorsFromRejection({ fieldErrors: null })).toBeNull();
  });
});
