// @vitest-environment node
import bcrypt from "bcryptjs";
import type { Pool } from "pg";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DUMMY_PASSWORD_HASH, authenticate, registerUser } from "./auth-service";

const USER = { id: "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21", email: "jane@example.com" };

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(async (password: string, hash: string) => hash === `hashed:${password}`),
}));

const repository = vi.hoisted(() => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
}));
vi.mock("./user-repository", () => repository);

const db = {} as Pool;

describe("auth service", () => {
  beforeEach(() => {
    repository.createUser.mockReset();
    repository.findUserByEmail.mockReset();
    vi.mocked(hashPassword).mockClear();
    vi.mocked(verifyPassword).mockClear();
  });

  it("stores the hash, not the password, when registering", async () => {
    repository.createUser.mockResolvedValue(USER);

    await expect(registerUser(db, { email: USER.email, password: "correct horse" })).resolves.toEqual(USER);
    expect(repository.createUser).toHaveBeenCalledWith(db, USER.email, "hashed:correct horse");
  });

  it("returns the user without the hash when the password matches", async () => {
    repository.findUserByEmail.mockResolvedValue({ ...USER, passwordHash: "hashed:correct horse" });

    await expect(authenticate(db, { email: USER.email, password: "correct horse" })).resolves.toEqual(USER);
  });

  it("returns null for a wrong password and for an unknown email", async () => {
    repository.findUserByEmail.mockResolvedValueOnce({ ...USER, passwordHash: "hashed:correct horse" });
    await expect(authenticate(db, { email: USER.email, password: "wrong" })).resolves.toBeNull();

    repository.findUserByEmail.mockResolvedValue(null);
    await expect(authenticate(db, { email: "nobody@example.com", password: "anything" })).resolves.toBeNull();
  });

  // Hashing on the first unknown email would make that request twice as slow as a wrong password.
  it("compares an unknown email against a precomputed hash without hashing anything", async () => {
    repository.findUserByEmail.mockResolvedValue(null);

    await expect(authenticate(db, { email: "nobody@example.com", password: "anything" })).resolves.toBeNull();

    expect(hashPassword).not.toHaveBeenCalled();
    expect(verifyPassword).toHaveBeenCalledWith("anything", DUMMY_PASSWORD_HASH);
  });

  it("uses a real bcrypt hash with the same cost as stored passwords", () => {
    expect(bcrypt.getRounds(DUMMY_PASSWORD_HASH)).toBe(12);
  });
});
