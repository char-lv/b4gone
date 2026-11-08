import {
  createItem,
  deleteItem,
  findItem,
  listItems,
  setItemStatus,
  updateItem,
} from "@/features/items/item-repository";
import type { NewItemInput } from "@/features/items/item-schema";
import { getPool } from "@/lib/db/pool";

// Item persistence and ownership against the test database (issue #4). It deletes only the
// @items-test.example accounts it creates; their items go with them.
const DOMAIN = "items-test.example";

const COAT: NewItemInput = {
  name: "Wool coat",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
};

async function createOwner(name: string): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    "insert into users (email, password_hash) values ($1, 'not-a-real-hash') returning id",
    [`${name}@${DOMAIN}`],
  );
  return result.rows[0].id;
}

async function removeOwners(): Promise<void> {
  await getPool().query("delete from users where email like $1", [`%@${DOMAIN}`]);
}

/** Moves an item's updated_at into the past so a later change is visible. */
async function ageItem(id: string): Promise<Date> {
  const result = await getPool().query<{ updatedAt: Date }>(
    `update items set updated_at = '2026-01-01T00:00:00Z' where id = $1 returning updated_at as "updatedAt"`,
    [id],
  );
  return result.rows[0].updatedAt;
}

async function updatedAt(id: string): Promise<Date> {
  const result = await getPool().query<{ updatedAt: Date }>(`select updated_at as "updatedAt" from items where id = $1`, [id]);
  return result.rows[0].updatedAt;
}

beforeEach(removeOwners);
afterAll(removeOwners);

describe("createItem", () => {
  it("stores one active item for the owner and returns it with camelCase fields", async () => {
    const ownerId = await createOwner("jane");

    const item = await createItem(getPool(), ownerId, COAT);

    expect(item).toEqual({ id: expect.any(String), ...COAT, status: "active" });
    const stored = await getPool().query("select owner_id, price_cents from items where id = $1", [item.id]);
    expect(stored.rows).toEqual([{ owner_id: ownerId, price_cents: 18950 }]);
  });

  it("keeps a blank price as null and a free item as zero", async () => {
    const ownerId = await createOwner("jane");

    const unknown = await createItem(getPool(), ownerId, { ...COAT, priceCents: null });
    const free = await createItem(getPool(), ownerId, { ...COAT, priceCents: 0 });

    expect(unknown.priceCents).toBeNull();
    expect(free.priceCents).toBe(0);
  });
});

describe("date-only values", () => {
  // pg parses DATE columns into JavaScript Dates at local midnight by default, which can show the
  // previous day in another time zone. Items must come back as the exact YYYY-MM-DD strings saved.
  it("come back as the saved calendar dates whatever the session time zone", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createItem(getPool(), ownerId, {
      ...COAT,
      purchaseDate: "2026-01-01",
      returnDeadline: "2026-01-31",
      warrantyExpiration: "2028-02-29",
    });

    const client = await getPool().connect();
    try {
      await client.query("set time zone 'Pacific/Kiritimati'");
      await client.query("set datestyle to 'SQL, DMY'");
      const [listed] = await listItems(client, ownerId);
      expect(listed).toMatchObject({
        purchaseDate: "2026-01-01",
        returnDeadline: "2026-01-31",
        warrantyExpiration: "2028-02-29",
      });
      expect(await findItem(client, ownerId, saved.id)).toEqual(listed);
    } finally {
      await client.query("reset time zone");
      await client.query("reset datestyle");
      client.release();
    }
  });
});

describe("listItems", () => {
  it("returns an empty list for an owner without items", async () => {
    expect(await listItems(getPool(), await createOwner("jane"))).toEqual([]);
  });

  it("lists the newest purchases first, then by name, ignoring case", async () => {
    const ownerId = await createOwner("jane");
    for (const [name, purchaseDate] of [
      ["Desk lamp", "2026-09-30"],
      ["wool coat", "2026-10-09"],
      ["Boots", "2026-10-09"],
      ["Atlas", "2026-10-09"],
    ]) {
      await createItem(getPool(), ownerId, { ...COAT, name, purchaseDate, returnDeadline: null });
    }

    const names = (await listItems(getPool(), ownerId)).map((item) => item.name);

    expect(names).toEqual(["Atlas", "Boots", "wool coat", "Desk lamp"]);
  });

  it("keeps two items with the same name and date in the order they were added", async () => {
    const ownerId = await createOwner("jane");
    const first = await createItem(getPool(), ownerId, COAT);
    const second = await createItem(getPool(), ownerId, COAT);

    const ids = (await listItems(getPool(), ownerId)).map((item) => item.id);

    expect(ids).toEqual([first.id, second.id]);
  });
});

describe("ownership", () => {
  it("never lists or finds another owner's items", async () => {
    const jane = await createOwner("jane");
    const sam = await createOwner("sam");
    const janesCoat = await createItem(getPool(), jane, COAT);
    const samsLamp = await createItem(getPool(), sam, { ...COAT, name: "Desk lamp" });

    expect((await listItems(getPool(), jane)).map((item) => item.id)).toEqual([janesCoat.id]);
    expect(await findItem(getPool(), jane, samsLamp.id)).toBeNull();
    expect(await findItem(getPool(), sam, janesCoat.id)).toBeNull();
    expect(await findItem(getPool(), jane, janesCoat.id)).toEqual(janesCoat);
  });

  it.each(["not-a-uuid", "", "00000000-0000-4000-8000-000000000000", "' or 1=1 --"])(
    "finds nothing for the id %j",
    async (id) => {
      expect(await findItem(getPool(), await createOwner("jane"), id)).toBeNull();
    },
  );
});

// Issue #5: edit, return, undo, and delete, each limited to the owner's own items.
describe("updateItem", () => {
  it("replaces every field, keeps the status, and marks the row updated", async () => {
    const jane = await createOwner("jane");
    const coat = await createItem(getPool(), jane, COAT);
    await setItemStatus(getPool(), jane, coat.id, "returned");
    const before = await ageItem(coat.id);

    const edited = await updateItem(getPool(), jane, coat.id, {
      name: "Wool coat (navy)",
      purchaseDate: "2026-10-10",
      priceCents: 0,
      returnDeadline: null,
      warrantyExpiration: "2027-10-10",
    });

    expect(edited).toEqual({
      id: coat.id,
      name: "Wool coat (navy)",
      purchaseDate: "2026-10-10",
      priceCents: 0,
      returnDeadline: null,
      warrantyExpiration: "2027-10-10",
      status: "returned",
    });
    expect(await findItem(getPool(), jane, coat.id)).toEqual(edited);
    expect((await updatedAt(coat.id)).getTime()).toBeGreaterThan(before.getTime());
  });

  it("can clear a price back to null", async () => {
    const jane = await createOwner("jane");
    const coat = await createItem(getPool(), jane, COAT);

    expect(await updateItem(getPool(), jane, coat.id, { ...COAT, priceCents: null })).toMatchObject({ priceCents: null });
  });
});

describe("setItemStatus", () => {
  it("marks an item returned and active again without touching its other fields", async () => {
    const jane = await createOwner("jane");
    const coat = await createItem(getPool(), jane, COAT);

    expect(await setItemStatus(getPool(), jane, coat.id, "returned")).toEqual({ ...coat, status: "returned" });
    expect(await setItemStatus(getPool(), jane, coat.id, "active")).toEqual(coat);
  });

  it("updates updated_at only when the status really changes", async () => {
    const jane = await createOwner("jane");
    const coat = await createItem(getPool(), jane, COAT);
    const before = await ageItem(coat.id);

    await setItemStatus(getPool(), jane, coat.id, "active");
    expect(await updatedAt(coat.id)).toEqual(before);

    await setItemStatus(getPool(), jane, coat.id, "returned");
    expect((await updatedAt(coat.id)).getTime()).toBeGreaterThan(before.getTime());
  });
});

describe("deleteItem", () => {
  it("removes the item and reports whether anything was deleted", async () => {
    const jane = await createOwner("jane");
    const coat = await createItem(getPool(), jane, COAT);

    expect(await deleteItem(getPool(), jane, coat.id)).toBe(true);
    expect(await findItem(getPool(), jane, coat.id)).toBeNull();
    expect(await deleteItem(getPool(), jane, coat.id)).toBe(false);
  });
});

describe("ownership of changes", () => {
  it("never edits, returns, or deletes another owner's item", async () => {
    const jane = await createOwner("jane");
    const sam = await createOwner("sam");
    const janesCoat = await createItem(getPool(), jane, COAT);
    const before = await ageItem(janesCoat.id);

    expect(await updateItem(getPool(), sam, janesCoat.id, { ...COAT, name: "Taken" })).toBeNull();
    expect(await setItemStatus(getPool(), sam, janesCoat.id, "returned")).toBeNull();
    expect(await deleteItem(getPool(), sam, janesCoat.id)).toBe(false);

    expect(await findItem(getPool(), jane, janesCoat.id)).toEqual(janesCoat);
    expect(await updatedAt(janesCoat.id)).toEqual(before);
  });

  it.each(["not-a-uuid", "00000000-0000-4000-8000-000000000000", "' or 1=1 --"])(
    "changes nothing for the id %j",
    async (id) => {
      const jane = await createOwner("jane");
      const coat = await createItem(getPool(), jane, COAT);

      expect(await updateItem(getPool(), jane, id, COAT)).toBeNull();
      expect(await setItemStatus(getPool(), jane, id, "returned")).toBeNull();
      expect(await deleteItem(getPool(), jane, id)).toBe(false);
      expect(await listItems(getPool(), jane)).toEqual([coat]);
    },
  );
});
