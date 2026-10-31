// @vitest-environment node
import type { Pool } from "pg";
import { authenticate, registerUser } from "./auth-service";

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
    // The placeholder hash is computed once and reused for later unknown emails.
    await expect(authenticate(db, { email: "nobody@example.com", password: "anything" })).resolves.toBeNull();
  });
});
