// @vitest-environment node
import { BCRYPT_MAX_BYTES, PasswordTooLongError, hashPassword, verifyPassword } from "./password";

// Low cost keeps the suite fast; production uses the default cost.
const TEST_ROUNDS = 4;

describe("hashPassword and verifyPassword", () => {
  it("stores a bcrypt hash, never the password itself", async () => {
    const hash = await hashPassword("correct horse battery", TEST_ROUNDS);

    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(hash).not.toContain("correct horse battery");
  });

  it("accepts the original password and rejects a different one", async () => {
    const hash = await hashPassword("correct horse battery", TEST_ROUNDS);

    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true);
    await expect(verifyPassword("correct horse batterY", hash)).resolves.toBe(false);
  });

  it(`hashes a password of exactly ${BCRYPT_MAX_BYTES} bytes`, async () => {
    const hash = await hashPassword("a".repeat(BCRYPT_MAX_BYTES), TEST_ROUNDS);

    await expect(verifyPassword("a".repeat(BCRYPT_MAX_BYTES), hash)).resolves.toBe(true);
  });

  it("refuses to hash a password longer than bcrypt's byte limit instead of truncating it", async () => {
    await expect(hashPassword("a".repeat(BCRYPT_MAX_BYTES + 1), TEST_ROUNDS)).rejects.toBeInstanceOf(
      PasswordTooLongError,
    );
    // 37 two-byte characters are 74 bytes even though the string has only 37 characters.
    await expect(hashPassword("é".repeat(37), TEST_ROUNDS)).rejects.toBeInstanceOf(PasswordTooLongError);
  });

  it("does not match a longer password whose first 72 bytes equal a stored password", async () => {
    const hash = await hashPassword("a".repeat(BCRYPT_MAX_BYTES), TEST_ROUNDS);

    await expect(verifyPassword("a".repeat(BCRYPT_MAX_BYTES + 1), hash)).resolves.toBe(false);
  });

  it("returns false for a malformed stored hash", async () => {
    await expect(verifyPassword("anything", "not-a-bcrypt-hash")).resolves.toBe(false);
  });
});
