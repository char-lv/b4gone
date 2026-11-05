// @vitest-environment node
import type { Pool } from "pg";
import { EmailTakenError, createUser, findUserByEmail, findUserById } from "./user-repository";

function fakeDb(result: { rows: unknown[] } | Error): { db: Pool; query: ReturnType<typeof vi.fn> } {
  const query = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  return { db: { query } as unknown as Pool, query };
}

const USER = { id: "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21", email: "jane@example.com" };

describe("user repository", () => {
  it("inserts with parameters and returns only the id and email", async () => {
    const { db, query } = fakeDb({ rows: [USER] });

    await expect(createUser(db, USER.email, "$2b$12$hash")).resolves.toEqual(USER);
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/returning id, email$/), [USER.email, "$2b$12$hash"]);
  });

  it("turns a unique violation into EmailTakenError and rethrows anything else", async () => {
    const duplicate = Object.assign(new Error("duplicate key"), { code: "23505" });
    const outage = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });

    await expect(createUser(fakeDb(duplicate).db, USER.email, "hash")).rejects.toBeInstanceOf(EmailTakenError);
    await expect(createUser(fakeDb(outage).db, USER.email, "hash")).rejects.toBe(outage);
  });

  it("finds users by email or id and returns null when there is no row", async () => {
    await expect(findUserByEmail(fakeDb({ rows: [{ ...USER, passwordHash: "h" }] }).db, USER.email)).resolves.toEqual({
      ...USER,
      passwordHash: "h",
    });
    await expect(findUserByEmail(fakeDb({ rows: [] }).db, USER.email)).resolves.toBeNull();
    await expect(findUserById(fakeDb({ rows: [USER] }).db, USER.id)).resolves.toEqual(USER);
    await expect(findUserById(fakeDb({ rows: [] }).db, USER.id)).resolves.toBeNull();
  });
});
