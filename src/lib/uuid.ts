const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a UUID in its usual 8-4-4-4-12 hex form, the shape of every id the database creates. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
