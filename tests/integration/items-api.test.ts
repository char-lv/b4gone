import { NextRequest } from "next/server";
import { DELETE as deleteItem, GET as getItem, PUT as putItem } from "@/app/api/items/[id]/route";
import { PUT as putStatus } from "@/app/api/items/[id]/status/route";
import { GET as listItems, POST as createItem } from "@/app/api/items/route";
import { SESSION_COOKIE_NAME, createSessionToken, readSessionSecret } from "@/lib/auth/session";
import { getPool } from "@/lib/db/pool";

// The item API against the test database (issue #4): sessions, validation, persistence, and
// two-user ownership. It deletes only the @items-api-test.example accounts it creates.
const SITE = "http://localhost:3000";
const DOMAIN = "items-api-test.example";
// 02:30 UTC on Oct 24, 2026 is still Oct 23 in New York but already Oct 24 in Tokyo.
const NOW = new Date("2026-10-24T02:30:00Z");

const COAT = {
  name: "  Wool coat ",
  purchaseDate: "2026-10-09",
  priceCents: 18950,
  returnDeadline: "2026-11-08",
  warrantyExpiration: null,
  timeZone: "America/New_York",
};

type Account = { id: string; cookie: string };

async function createAccount(name: string): Promise<Account> {
  const result = await getPool().query<{ id: string }>(
    "insert into users (email, password_hash) values ($1, 'not-a-real-hash') returning id",
    [`${name}@${DOMAIN}`],
  );
  const id = result.rows[0].id;
  const token = await createSessionToken(id, readSessionSecret(process.env), NOW);
  return { id, cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

function post(body: unknown, { cookie, headers = {} }: { cookie?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`${SITE}/api/items`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE, ...(cookie ? { cookie } : {}), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function get(path: string, cookie?: string): NextRequest {
  return new NextRequest(`${SITE}${path}`, { headers: cookie ? { cookie } : {} });
}

async function json(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function detail(id: string, cookie?: string): Promise<Response> {
  return getItem(get(`/api/items/${encodeURIComponent(id)}`, cookie), { params: Promise.resolve({ id }) });
}

async function countItems(ownerId: string): Promise<number> {
  const result = await getPool().query<{ count: number }>(
    "select count(*)::int as count from items where owner_id = $1",
    [ownerId],
  );
  return result.rows[0].count;
}

async function removeAccounts(): Promise<void> {
  await getPool().query("delete from users where email like $1", [`%@${DOMAIN}`]);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  await removeAccounts();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(removeAccounts);

describe("POST /api/items", () => {
  it("creates exactly one active item owned by the signed-in user", async () => {
    const jane = await createAccount("jane");

    const response = await createItem(post({ ...COAT, ownerId: "someone-else" }, { cookie: jane.cookie }));

    expect(response.status).toBe(201);
    expect(await json(response)).toEqual({
      item: {
        id: expect.any(String),
        name: "Wool coat",
        purchaseDate: "2026-10-09",
        priceCents: 18950,
        returnDeadline: "2026-11-08",
        warrantyExpiration: null,
        status: "active",
      },
    });
    expect(await countItems(jane.id)).toBe(1);
  });

  it("keeps a blank price as null and a free item as zero", async () => {
    const jane = await createAccount("jane");

    const unknown = await createItem(post({ ...COAT, priceCents: null }, { cookie: jane.cookie }));
    const free = await createItem(post({ ...COAT, priceCents: 0 }, { cookie: jane.cookie }));

    expect(await json(unknown)).toMatchObject({ item: { priceCents: null } });
    expect(await json(free)).toMatchObject({ item: { priceCents: 0 } });
  });

  it("checks the purchase date against today in the user's time zone", async () => {
    const jane = await createAccount("jane");
    const tomorrowInNewYork = { ...COAT, purchaseDate: "2026-10-24", returnDeadline: null };

    const inNewYork = await createItem(post(tomorrowInNewYork, { cookie: jane.cookie }));
    const inTokyo = await createItem(post({ ...tomorrowInNewYork, timeZone: "Asia/Tokyo" }, { cookie: jane.cookie }));

    expect(inNewYork.status).toBe(400);
    expect(await json(inNewYork)).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: { purchaseDate: "Purchase date can’t be in the future." },
      },
    });
    expect(inTokyo.status).toBe(201);
    expect(await countItems(jane.id)).toBe(1);
  });

  it.each([
    ["missing", undefined],
    ["not a string", 42],
    ["unknown", "Mars/Olympus_Mons"],
    ["blank", ""],
  ])("rejects a %s time zone without saving", async (_label, timeZone) => {
    const jane = await createAccount("jane");

    const response = await createItem(post({ ...COAT, timeZone }, { cookie: jane.cookie }));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: { code: "validation_failed", fields: { timeZone: expect.any(String) } },
    });
    expect(await countItems(jane.id)).toBe(0);
  });

  it("returns every field error at once and saves nothing", async () => {
    const jane = await createAccount("jane");

    const response = await createItem(
      post(
        { name: "   ", purchaseDate: "2026-02-30", priceCents: 100_000_000, returnDeadline: "soon", timeZone: "UTC" },
        { cookie: jane.cookie },
      ),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: {
          name: "Enter a name.",
          purchaseDate: "Enter a complete, real date.",
          priceCents: "Enter an amount up to $999,999.99.",
          returnDeadline: "Enter a complete, real date, or clear the field.",
        },
      },
    });
    expect(await countItems(jane.id)).toBe(0);
  });

  // Both values used to pass validation and then fail in PostgreSQL with a 500.
  it.each([
    ["a year-0 purchase date", { purchaseDate: "0000-01-01", returnDeadline: null }, "purchaseDate"],
    ["a NUL character in the name", { name: "Coat\u0000" }, "name"],
  ])("answers %s with a field error and saves nothing", async (_label, change, field) => {
    const jane = await createAccount("jane");

    const response = await createItem(post({ ...COAT, ...change }, { cookie: jane.cookie }));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({ error: { code: "validation_failed", fields: { [field]: expect.any(String) } } });
    expect(await countItems(jane.id)).toBe(0);
  });

  it("refuses a body that is not sent as JSON", async () => {
    const jane = await createAccount("jane");

    const response = await createItem(
      post(JSON.stringify(COAT), { cookie: jane.cookie, headers: { "content-type": "text/plain" } }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: { code: "invalid_json", message: "Send the request body as JSON." } });
    expect(await countItems(jane.id)).toBe(0);
  });

  it("refuses a cross-site request before reading the session", async () => {
    const jane = await createAccount("jane");

    const response = await createItem(post(COAT, { cookie: jane.cookie, headers: { origin: "https://evil.example" } }));

    expect(response.status).toBe(403);
    expect(await countItems(jane.id)).toBe(0);
  });

  it("requires a session", async () => {
    const response = await createItem(post(COAT));

    expect(response.status).toBe(401);
    expect(await json(response)).toEqual({ error: { code: "unauthenticated", message: "Sign in to continue." } });
  });
});

describe("GET /api/items", () => {
  it("lists only the signed-in user's items, newest purchases first", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    await createItem(post({ ...COAT, name: "Desk lamp", purchaseDate: "2026-09-30", returnDeadline: null }, { cookie: jane.cookie }));
    await createItem(post(COAT, { cookie: jane.cookie }));
    await createItem(post({ ...COAT, name: "Sam's bike" }, { cookie: sam.cookie }));

    const response = await listItems(get("/api/items", jane.cookie));

    expect(response.status).toBe(200);
    const body = (await json(response)) as { items: { name: string }[] };
    expect(body.items.map((item) => item.name)).toEqual(["Wool coat", "Desk lamp"]);
  });

  it("returns an empty list for a new account", async () => {
    const jane = await createAccount("jane");

    expect(await json(await listItems(get("/api/items", jane.cookie)))).toEqual({ items: [] });
  });

  it("requires a session", async () => {
    expect((await listItems(get("/api/items"))).status).toBe(401);
  });
});

describe("GET /api/items/:id", () => {
  it("returns the owner's item", async () => {
    const jane = await createAccount("jane");
    const created = (await json(await createItem(post(COAT, { cookie: jane.cookie })))) as { item: { id: string } };

    const response = await detail(created.item.id, jane.cookie);

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual(created);
  });

  it("answers another user's item exactly like a missing one", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const janes = (await json(await createItem(post(COAT, { cookie: jane.cookie })))) as { item: { id: string } };

    const foreign = await detail(janes.item.id, sam.cookie);
    const missing = await detail("00000000-0000-4000-8000-000000000000", sam.cookie);

    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    const foreignBody = await json(foreign);
    expect(foreignBody).toEqual({ error: { code: "not_found", message: "Item not found." } });
    expect(await json(missing)).toEqual(foreignBody);
  });

  it.each(["not-a-uuid", "1 or 1=1"])("returns 404 for the malformed id %j", async (id) => {
    const jane = await createAccount("jane");

    expect((await detail(id, jane.cookie)).status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await detail("00000000-0000-4000-8000-000000000000")).status).toBe(401);
  });
});

// Issue #5: edit, return/undo, and delete.
type Saved = { item: { id: string; status: string } };

function send(
  method: "PUT" | "DELETE",
  path: string,
  body: unknown,
  { cookie, headers = {} }: { cookie?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    method,
    headers: { "content-type": "application/json", origin: SITE, ...(cookie ? { cookie } : {}), ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function edit(id: string, body: unknown, options?: { cookie?: string; headers?: Record<string, string> }) {
  return putItem(send("PUT", `/api/items/${encodeURIComponent(id)}`, body, options), params(id));
}

async function status(id: string, body: unknown, options?: { cookie?: string; headers?: Record<string, string> }) {
  return putStatus(send("PUT", `/api/items/${encodeURIComponent(id)}/status`, body, options), params(id));
}

async function remove(id: string, options?: { cookie?: string; headers?: Record<string, string> }) {
  return deleteItem(send("DELETE", `/api/items/${encodeURIComponent(id)}`, undefined, options), params(id));
}

async function saveCoat(account: Account): Promise<Saved> {
  return (await json(await createItem(post(COAT, { cookie: account.cookie })))) as Saved;
}

async function stored(account: Account, id: string): Promise<unknown> {
  return json(await detail(id, account.cookie));
}

const EDITED = {
  name: " Wool coat (navy) ",
  purchaseDate: "2026-10-10",
  priceCents: 0,
  returnDeadline: null,
  warrantyExpiration: "2027-10-10",
  timeZone: "America/New_York",
};

describe("PUT /api/items/:id", () => {
  it("replaces every field and keeps the status", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);
    await status(coat.item.id, { status: "returned" }, { cookie: jane.cookie });

    const response = await edit(coat.item.id, EDITED, { cookie: jane.cookie });

    expect(response.status).toBe(200);
    const expected = {
      item: {
        id: coat.item.id,
        name: "Wool coat (navy)",
        purchaseDate: "2026-10-10",
        priceCents: 0,
        returnDeadline: null,
        warrantyExpiration: "2027-10-10",
        status: "returned",
      },
    };
    expect(await json(response)).toEqual(expected);
    expect(await stored(jane, coat.item.id)).toEqual(expected);
  });

  it("uses the same validation as creating an item, with today in the user's time zone", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);
    const tomorrowInNewYork = { ...EDITED, purchaseDate: "2026-10-24", warrantyExpiration: null };

    const inNewYork = await edit(coat.item.id, { ...tomorrowInNewYork, name: "   " }, { cookie: jane.cookie });
    expect(inNewYork.status).toBe(400);
    expect(await json(inNewYork)).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: { name: "Enter a name.", purchaseDate: "Purchase date can’t be in the future." },
      },
    });
    expect(await stored(jane, coat.item.id)).toEqual(coat);

    const inTokyo = await edit(coat.item.id, { ...tomorrowInNewYork, timeZone: "Asia/Tokyo" }, { cookie: jane.cookie });
    expect(inTokyo.status).toBe(200);
  });

  it("needs every field, because an edit replaces the whole item", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    const response = await edit(
      coat.item.id,
      { name: "Wool coat", purchaseDate: "2026-10-09", timeZone: "America/New_York" },
      { cookie: jane.cookie },
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: {
        code: "validation_failed",
        fields: {
          priceCents: expect.any(String),
          returnDeadline: expect.any(String),
          warrantyExpiration: expect.any(String),
        },
      },
    });
    expect(await stored(jane, coat.item.id)).toEqual(coat);
  });

  it("rejects a missing time zone without saving", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    const response = await edit(coat.item.id, { ...EDITED, timeZone: undefined }, { cookie: jane.cookie });

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({ error: { fields: { timeZone: expect.any(String) } } });
    expect(await stored(jane, coat.item.id)).toEqual(coat);
  });

  it("refuses non-JSON bodies, cross-site requests, and requests without a session", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    const text = await edit(coat.item.id, JSON.stringify(EDITED), { cookie: jane.cookie, headers: { "content-type": "text/plain" } });
    expect(text.status).toBe(400);
    expect(await json(text)).toMatchObject({ error: { code: "invalid_json" } });
    expect((await edit(coat.item.id, EDITED, { cookie: jane.cookie, headers: { origin: "https://evil.example" } })).status).toBe(403);
    expect((await edit(coat.item.id, EDITED)).status).toBe(401);
    expect(await stored(jane, coat.item.id)).toEqual(coat);
  });
});

describe("PUT /api/items/:id/status", () => {
  it("marks an item returned and active again", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    const returned = await status(coat.item.id, { status: "returned" }, { cookie: jane.cookie });
    expect(returned.status).toBe(200);
    expect(await json(returned)).toEqual({ item: { ...coat.item, status: "returned" } });

    const restored = await status(coat.item.id, { status: "active" }, { cookie: jane.cookie });
    expect(await json(restored)).toEqual(coat);
    expect(await stored(jane, coat.item.id)).toEqual(coat);
  });

  it("answers a repeated request with the same item instead of an error", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);
    await status(coat.item.id, { status: "returned" }, { cookie: jane.cookie });

    const again = await status(coat.item.id, { status: "returned" }, { cookie: jane.cookie });

    expect(again.status).toBe(200);
    expect(await json(again)).toEqual({ item: { ...coat.item, status: "returned" } });
  });

  it.each([[{}], [{ status: "lost" }], [{ status: "Returned" }], [{ status: null }], [[]]])(
    "rejects the body %j with a field error",
    async (body) => {
      const jane = await createAccount("jane");
      const coat = await saveCoat(jane);

      const response = await status(coat.item.id, body, { cookie: jane.cookie });

      expect(response.status).toBe(400);
      expect(await json(response)).toEqual({
        error: {
          code: "validation_failed",
          message: "Check the highlighted fields.",
          fields: { status: "Choose active or returned." },
        },
      });
      expect(await stored(jane, coat.item.id)).toEqual(coat);
    },
  );

  it("refuses non-JSON bodies, cross-site requests, and requests without a session", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);
    const body = { status: "returned" };

    const text = await status(coat.item.id, JSON.stringify(body), { cookie: jane.cookie, headers: { "content-type": "text/plain" } });
    expect(text.status).toBe(400);
    expect((await status(coat.item.id, body, { cookie: jane.cookie, headers: { origin: "https://evil.example" } })).status).toBe(403);
    expect((await status(coat.item.id, body)).status).toBe(401);
    expect(await stored(jane, coat.item.id)).toEqual(coat);
  });
});

describe("DELETE /api/items/:id", () => {
  it("deletes the item, and a second delete finds nothing", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    const response = await remove(coat.item.id, { cookie: jane.cookie });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect((await detail(coat.item.id, jane.cookie)).status).toBe(404);
    expect((await remove(coat.item.id, { cookie: jane.cookie })).status).toBe(404);
    expect(await countItems(jane.id)).toBe(0);
  });

  it("refuses cross-site requests and requests without a session", async () => {
    const jane = await createAccount("jane");
    const coat = await saveCoat(jane);

    expect((await remove(coat.item.id, { cookie: jane.cookie, headers: { origin: "https://evil.example" } })).status).toBe(403);
    expect((await remove(coat.item.id)).status).toBe(401);
    expect(await countItems(jane.id)).toBe(1);
  });
});

describe("changes to another user's item", () => {
  it("answer exactly like a missing item and change nothing", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const coat = await saveCoat(jane);
    const missing = "00000000-0000-4000-8000-000000000000";
    const notFound = { error: { code: "not_found", message: "Item not found." } };

    for (const id of [coat.item.id, missing, "not-a-uuid"]) {
      const edited = await edit(id, EDITED, { cookie: sam.cookie });
      const returned = await status(id, { status: "returned" }, { cookie: sam.cookie });
      const deleted = await remove(id, { cookie: sam.cookie });

      expect([edited.status, returned.status, deleted.status]).toEqual([404, 404, 404]);
      expect(await json(edited)).toEqual(notFound);
      expect(await json(returned)).toEqual(notFound);
      expect(await json(deleted)).toEqual(notFound);
    }
    expect(await stored(jane, coat.item.id)).toEqual(coat);
    expect(await countItems(sam.id)).toBe(0);
  });
});
