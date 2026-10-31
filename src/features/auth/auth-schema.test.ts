import { fieldErrors, registerSchema, signInSchema } from "./auth-schema";

function errorsFor(schema: typeof registerSchema | typeof signInSchema, input: unknown): Record<string, string> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return fieldErrors(result.error);
}

describe("registerSchema", () => {
  it("trims and lowercases the email and keeps the password exactly as typed", () => {
    expect(registerSchema.parse({ email: "  Jane.Doe@Example.COM ", password: " pass word " })).toEqual({
      email: "jane.doe@example.com",
      password: " pass word ",
    });
  });

  it.each([
    [{ email: "", password: "long enough" }, { email: "Enter your email address." }],
    [{ email: "   ", password: "long enough" }, { email: "Enter your email address." }],
    [{ email: "jane@", password: "long enough" }, { email: "Enter a valid email address, like name@example.com." }],
    [{ password: "long enough" }, { email: "Enter your email address." }],
    [{ email: 42, password: "long enough" }, { email: "Enter your email address." }],
  ])("reports an email problem for %j", (input, expected) => {
    expect(errorsFor(registerSchema, input)).toEqual(expected);
  });

  it("rejects an email longer than 254 characters", () => {
    const email = `${"a".repeat(243)}@example.com`;

    expect(email).toHaveLength(255);
    expect(errorsFor(registerSchema, { email, password: "long enough" })).toEqual({
      email: "Email must be 254 characters or fewer.",
    });
  });

  it("accepts an email of exactly 254 characters", () => {
    const email = `${"a".repeat(242)}@example.com`;

    expect(registerSchema.safeParse({ email, password: "long enough" }).success).toBe(true);
  });

  it.each([
    ["", "Enter a password."],
    ["seven77", "Password must be at least 8 characters."],
    ["a".repeat(73), "Password must be at most 72 bytes. Some characters count as more than one byte."],
    ["é".repeat(37), "Password must be at most 72 bytes. Some characters count as more than one byte."],
  ])("reports a password problem for %j", (password, message) => {
    expect(errorsFor(registerSchema, { email: "jane@example.com", password })).toEqual({ password: message });
  });

  it("accepts passwords of 8 characters and of exactly 72 bytes", () => {
    expect(registerSchema.safeParse({ email: "jane@example.com", password: "eight888" }).success).toBe(true);
    expect(registerSchema.safeParse({ email: "jane@example.com", password: "é".repeat(36) }).success).toBe(true);
  });

  it("reports both fields at once", () => {
    expect(errorsFor(registerSchema, {})).toEqual({
      email: "Enter your email address.",
      password: "Enter a password.",
    });
  });
});

describe("signInSchema", () => {
  it("does not apply the registration length rule, so old short passwords still get a credential check", () => {
    expect(signInSchema.safeParse({ email: "jane@example.com", password: "short" }).success).toBe(true);
  });

  it("requires both fields and limits the password to 72 bytes", () => {
    expect(errorsFor(signInSchema, { email: "", password: "" })).toEqual({
      email: "Enter your email address.",
      password: "Enter your password.",
    });
    expect(errorsFor(signInSchema, { email: "jane@example.com", password: "a".repeat(73) })).toEqual({
      password: "Password must be at most 72 bytes. Some characters count as more than one byte.",
    });
  });
});
