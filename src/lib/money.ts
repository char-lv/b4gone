// USD amounts are stored as integer cents and formatted only for display.

export type MoneyErrorCode = "negative" | "symbols" | "format" | "decimals" | "too_large";

export type MoneyParseResult =
  | { ok: true; cents: number | null }
  | { ok: false; code: MoneyErrorCode };

/** $999,999.99. Amounts are stored in PostgreSQL integer columns, which hold at most 2147483647 (#4). */
export const MAX_AMOUNT_CENTS = 99_999_999;

const AMOUNT_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/** Parses entered USD text. Blank input means no amount; zero is a real amount. Never rounds. */
export function parseUsdToCents(raw: string): MoneyParseResult {
  const text = raw.trim();
  if (text === "") return { ok: true, cents: null };
  if (text.startsWith("-")) return { ok: false, code: "negative" };
  if (/[$,]/.test(text)) return { ok: false, code: "symbols" };

  const match = AMOUNT_PATTERN.exec(text);
  if (!match) return { ok: false, code: "format" };
  const fraction = match[2] ?? "";
  if (fraction.length > 2) return { ok: false, code: "decimals" };

  const cents = Number(match[1]) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents > MAX_AMOUNT_CENTS) return { ok: false, code: "too_large" };
  return { ok: true, cents };
}

export function formatUsd(cents: number): string {
  const dollars = Math.floor(cents / 100).toLocaleString("en-US");
  return `$${dollars}.${String(cents % 100).padStart(2, "0")}`;
}
