// The name rule shared by items and subscriptions (PRD Section 3): 1-100 characters after trimming,
// at least one visible character, and one line.

export const RECORD_NAME_MAX = 100;

/** The error for an entered name, or undefined when it is valid. `emptyMessage` names the field. */
export function recordNameError(raw: string, emptyMessage: string): string | undefined {
  // Count code points so an emoji counts as one character.
  const length = Array.from(raw.trim()).length;
  // trim() keeps format characters such as U+200B, so a name needs at least one visible character.
  if (!/[^\p{Cf}\p{Z}\s]/u.test(raw)) return emptyMessage;
  // A name is one line (no Cc controls or U+2028/U+2029 separators), and PostgreSQL text cannot store U+0000.
  if (/[\p{Cc}\p{Zl}\p{Zp}]/u.test(raw.trim())) return "Remove tabs, line breaks, and other control characters.";
  if (length > RECORD_NAME_MAX) {
    return `Use ${RECORD_NAME_MAX} characters or fewer. This one has ${length}.`;
  }
  return undefined;
}
