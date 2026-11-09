// @vitest-environment node
import type { Pool } from "pg";
import { createItem, deleteItem, findItem, listItems, setItemStatus, updateItem } from "./item-repository";

// The database behavior is covered in tests/integration/item-repository.test.ts. These checks pin the
// owner predicate and parameters of each query without a database.
function fakeDb(rows: unknown[]): { db: Pool; query: ReturnType<typeof vi.fn> } {
  const query = vi.fn(async () => ({ rows }));
  return { db: { query } as unknown as Pool, query };
}

const OWNER = "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21";
const ITEM_ID = "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c";
const INPUT = {
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: null,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
};
const ITEM = { id: ITEM_ID, ...INPUT, status: "active" };

describe("item repository", () => {
  it("inserts the owner and every field as parameters", async () => {
    const { db, query } = fakeDb([ITEM]);

    await expect(createItem(db, OWNER, INPUT)).resolves.toEqual(ITEM);
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/^insert into items/), [
      OWNER,
      "Wool coat",
      "2026-10-09",
      null,
      "2026-11-08",
      null,
    ]);
  });

  it("lists and finds items only through the owner predicate", async () => {
    const list = fakeDb([ITEM]);
    await expect(listItems(list.db, OWNER)).resolves.toEqual([ITEM]);
    expect(list.query).toHaveBeenCalledWith(expect.stringContaining("where owner_id = $1"), [OWNER]);

    const found = fakeDb([ITEM]);
    await expect(findItem(found.db, OWNER, ITEM_ID)).resolves.toEqual(ITEM);
    expect(found.query).toHaveBeenCalledWith(expect.stringContaining("where id = $1 and owner_id = $2"), [ITEM_ID, OWNER]);
  });

  it("returns null without querying for a malformed id, and for a missing row", async () => {
    const malformed = fakeDb([ITEM]);
    await expect(findItem(malformed.db, OWNER, "42")).resolves.toBeNull();
    expect(malformed.query).not.toHaveBeenCalled();

    await expect(findItem(fakeDb([]).db, OWNER, ITEM_ID)).resolves.toBeNull();
  });

  it("edits, sets the status, and deletes only through the owner predicate", async () => {
    const edit = fakeDb([ITEM]);
    await expect(updateItem(edit.db, OWNER, ITEM_ID, INPUT)).resolves.toEqual(ITEM);
    expect(edit.query).toHaveBeenCalledWith(expect.stringMatching(/^update items[\s\S]*where id = \$1 and owner_id = \$2/), [
      ITEM_ID,
      OWNER,
      "Wool coat",
      "2026-10-09",
      null,
      "2026-11-08",
      null,
    ]);

    const status = fakeDb([ITEM]);
    await expect(setItemStatus(status.db, OWNER, ITEM_ID, "returned")).resolves.toEqual(ITEM);
    expect(status.query).toHaveBeenCalledWith(expect.stringContaining("where id = $1 and owner_id = $2"), [
      ITEM_ID,
      OWNER,
      "returned",
    ]);

    const removal = fakeDb([{ id: ITEM_ID }]);
    await expect(deleteItem(removal.db, OWNER, ITEM_ID)).resolves.toBe(true);
    expect(removal.query).toHaveBeenCalledWith(expect.stringMatching(/^delete from items where id = \$1 and owner_id = \$2/), [
      ITEM_ID,
      OWNER,
    ]);
  });

  it("changes nothing without querying for a malformed id", async () => {
    const { db, query } = fakeDb([ITEM]);

    await expect(updateItem(db, OWNER, "42", INPUT)).resolves.toBeNull();
    await expect(setItemStatus(db, OWNER, "42", "active")).resolves.toBeNull();
    await expect(deleteItem(db, OWNER, "42")).resolves.toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
