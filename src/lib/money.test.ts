import { centsToInput, formatUsd, parseUsdToCents } from "./money";

describe("parseUsdToCents", () => {
  it("treats blank input as no amount, distinct from zero", () => {
    expect(parseUsdToCents("")).toEqual({ ok: true, cents: null });
    expect(parseUsdToCents("   ")).toEqual({ ok: true, cents: null });
    expect(parseUsdToCents("0")).toEqual({ ok: true, cents: 0 });
    expect(parseUsdToCents("0.00")).toEqual({ ok: true, cents: 0 });
  });

  it.each([
    ["49.99", 4999],
    ["49.9", 4990],
    ["49", 4900],
    ["  12.50 ", 1250],
    ["1299.99", 129999],
    ["0.01", 1],
    ["007.5", 750],
    ["999999.99", 99999999],
  ])("converts %j to %i cents", (raw, cents) => {
    expect(parseUsdToCents(raw)).toEqual({ ok: true, cents });
  });

  it.each([
    ["-1", "negative"],
    ["-0.01", "negative"],
    ["$5", "symbols"],
    ["1,299.99", "symbols"],
    ["1.999", "decimals"],
    ["0.001", "decimals"],
    ["abc", "format"],
    ["1.", "format"],
    [".5", "format"],
    ["1e3", "format"],
    ["1 000", "format"],
    ["99999999999999999", "too_large"],
    // A PostgreSQL integer column holds at most 2147483647, so amounts stop at $999,999.99 (#4).
    ["1000000", "too_large"],
    ["1000000.00", "too_large"],
    ["21474836.48", "too_large"],
  ])("rejects %j as %s", (raw, code) => {
    expect(parseUsdToCents(raw)).toEqual({ ok: false, code });
  });
});

describe("formatUsd", () => {
  it.each([
    [0, "$0.00"],
    [1, "$0.01"],
    [4999, "$49.99"],
    [129999, "$1,299.99"],
    [100000000, "$1,000,000.00"],
  ])("formats %i cents as %s", (cents, text) => {
    expect(formatUsd(cents)).toBe(text);
  });
});

describe("centsToInput", () => {
  it("fills the edit form with plain digits that parse back to the same cents", () => {
    expect(centsToInput(18950)).toBe("189.50");
    expect(centsToInput(1)).toBe("0.01");
    expect(centsToInput(129999)).toBe("1299.99");
    expect(centsToInput(99_999_999)).toBe("999999.99");
    for (const cents of [0, 1, 99, 100, 18950, 99_999_999]) {
      expect(parseUsdToCents(centsToInput(cents))).toEqual({ ok: true, cents });
    }
  });

  it("keeps zero as a real amount and no price as a blank field", () => {
    expect(centsToInput(0)).toBe("0.00");
    expect(centsToInput(null)).toBe("");
  });
});
