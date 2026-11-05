import { formatUsd, parseUsdToCents } from "./money";

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
