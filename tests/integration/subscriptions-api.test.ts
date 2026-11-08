import { NextRequest } from "next/server";
import { DELETE as deleteRoute, GET as detailRoute, PUT as editRoute } from "@/app/api/subscriptions/[id]/route";
import { PUT as statusRoute } from "@/app/api/subscriptions/[id]/status/route";
import { GET as listRoute, POST as createRoute } from "@/app/api/subscriptions/route";
import { SESSION_COOKIE_NAME, createSessionToken, readSessionSecret } from "@/lib/auth/session";
import { getPool } from "@/lib/db/pool";

// The subscription API against the test database (issue #7): sessions, origin and JSON checks,
// validation, persistence, next billing dates from #8, cancel/reactivate, and two-user ownership.
// It deletes only the @subscriptions-api-test.example accounts it creates.
const SITE = "http://localhost:3000";
const DOMAIN = "subscriptions-api-test.example";
// 02:30 UTC on Oct 24, 2026 is still Oct 23 in New York but already Oct 24 in Tokyo.
const NOW = new Date("2026-10-24T02:30:00Z");
const NEW_YORK = "America/New_York";

const MUSIC = {
  name: "  Music plan ",
  amountCents: 1099,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-31",
  timeZone: NEW_YORK,
};

type Account = { id: string; cookie: string };
type Options = { cookie?: string; headers?: Record<string, string> };

async function createAccount(name: string): Promise<Account> {
  const result = await getPool().query<{ id: string }>(
    "insert into users (email, password_hash) values ($1, 'not-a-real-hash') returning id",
    [`${name}@${DOMAIN}`],
  );
  const id = result.rows[0].id;
  const token = await createSessionToken(id, readSessionSecret(process.env), NOW);
  return { id, cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

function send(method: "POST" | "PUT" | "DELETE", path: string, body: unknown, { cookie, headers = {} }: Options = {}) {
  return new NextRequest(`${SITE}${path}`, {
    method,
    headers: { "content-type": "application/json", origin: SITE, ...(cookie ? { cookie } : {}), ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

function get(path: string, cookie?: string): NextRequest {
  return new NextRequest(`${SITE}${path}`, { headers: cookie ? { cookie } : {} });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function json(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function create(account: Account, body: Record<string, unknown> = {}): Promise<{ id: string }> {
  const response = await createRoute(send("POST", "/api/subscriptions", { ...MUSIC, ...body }, { cookie: account.cookie }));
  expect(response.status).toBe(201);
  return ((await json(response)) as { subscription: { id: string } }).subscription;
}

function detail(id: string, cookie?: string, timeZone = NEW_YORK): Promise<Response> {
  return detailRoute(get(`/api/subscriptions/${encodeURIComponent(id)}?timeZone=${encodeURIComponent(timeZone)}`, cookie), params(id));
}

function setStatus(id: string, body: unknown, options: Options): Promise<Response> {
  return statusRoute(send("PUT", `/api/subscriptions/${id}/status`, body, options), params(id));
}

async function stored(id: string): Promise<Record<string, unknown> | undefined> {
  const result = await getPool().query(
    `select name, amount_cents, billing_cycle, to_char(first_billing_date, 'YYYY-MM-DD') as anchor, status
     from subscriptions where id = $1`,
    [id],
  );
  return result.rows[0];
}

async function countSubscriptions(ownerId: string): Promise<number> {
  const result = await getPool().query<{ count: number }>(
    "select count(*)::int as count from subscriptions where owner_id = $1",
    [ownerId],
  );
  return result.rows[0].count;
}

async function removeAccounts(): Promise<void> {
  await getPool().query("delete from users where email like $1", [`%@${DOMAIN}`]);
}

const NOT_FOUND = { error: { code: "not_found", message: "Subscription not found." } };
const UNAUTHENTICATED = { error: { code: "unauthenticated", message: "Sign in to continue." } };
const FORBIDDEN = { error: { code: "forbidden_origin", message: "This request must come from the B4Gone site." } };
const INVALID_JSON = { error: { code: "invalid_json", message: "Send the request body as JSON." } };
const TIME_ZONE_ERROR = {
  error: {
    code: "validation_failed",
    message: "Check the highlighted fields.",
    fields: { timeZone: "Your browser’s time zone could not be read. Reload the page and try again." },
  },
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  await removeAccounts();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(removeAccounts);

describe("POST /api/subscriptions", () => {
  it("creates one active subscription for the signed-in user with its next billing date", async () => {
    const jane = await createAccount("jane");

    const response = await createRoute(
      send("POST", "/api/subscriptions", { ...MUSIC, ownerId: "someone-else", status: "cancelled" }, { cookie: jane.cookie }),
    );

    expect(response.status).toBe(201);
    expect(await json(response)).toEqual({
      subscription: {
        id: expect.any(String),
        name: "Music plan",
        amountCents: 1099,
        billingCycle: "monthly",
        firstBillingDate: "2026-01-31",
        status: "active",
        // The Jan 31 anchor clamps to Oct 31 in October; Oct 23 is today in New York.
        nextBillingDate: "2026-10-31",
      },
    });
    expect(await countSubscriptions(jane.id)).toBe(1);
  });

  it("accepts a free plan and a first billing date in the future, which is the next charge", async () => {
    const jane = await createAccount("jane");

    const response = await createRoute(
      send(
        "POST",
        "/api/subscriptions",
        { ...MUSIC, amountCents: 0, billingCycle: "yearly", firstBillingDate: "2027-02-28" },
        { cookie: jane.cookie },
      ),
    );

    expect(response.status).toBe(201);
    expect(await json(response)).toMatchObject({
      subscription: { amountCents: 0, billingCycle: "yearly", firstBillingDate: "2027-02-28", nextBillingDate: "2027-02-28" },
    });
  });

  it("counts a charge due today in the user's time zone as the next charge", async () => {
    const jane = await createAccount("jane");
    const anchoredOn23rd = { ...MUSIC, firstBillingDate: "2026-01-23" };

    const inNewYork = await createRoute(send("POST", "/api/subscriptions", anchoredOn23rd, { cookie: jane.cookie }));
    const inTokyo = await createRoute(
      send("POST", "/api/subscriptions", { ...anchoredOn23rd, timeZone: "Asia/Tokyo" }, { cookie: jane.cookie }),
    );

    expect(await json(inNewYork)).toMatchObject({ subscription: { nextBillingDate: "2026-10-23" } });
    expect(await json(inTokyo)).toMatchObject({ subscription: { nextBillingDate: "2026-11-23" } });
  });

  it("answers every invalid field at once and saves nothing", async () => {
    const jane = await createAccount("jane");

    const response = await createRoute(
      send(
        "POST",
        "/api/subscriptions",
        { name: " ", amountCents: 15.5, billingCycle: "weekly", firstBillingDate: "2026-02-29", timeZone: NEW_YORK },
        { cookie: jane.cookie },
      ),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: {
          name: "Enter a service name.",
          amountCents: "Enter an amount like 15.99.",
          billingCycle: "Choose monthly or yearly.",
          firstBillingDate: "Enter a complete, real date.",
        },
      },
    });
    expect(await countSubscriptions(jane.id)).toBe(0);
  });

  it("requires an amount: null is not a free plan", async () => {
    const jane = await createAccount("jane");

    const response = await createRoute(send("POST", "/api/subscriptions", { ...MUSIC, amountCents: null }, { cookie: jane.cookie }));

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: { fields: { amountCents: "Enter the amount. Use 0 for a free plan." } },
    });
  });

  it.each([
    ["missing", undefined],
    ["unknown", "Mars/Olympus_Mons"],
  ])("rejects a %s time zone without saving", async (_label, timeZone) => {
    const jane = await createAccount("jane");

    const response = await createRoute(send("POST", "/api/subscriptions", { ...MUSIC, timeZone }, { cookie: jane.cookie }));

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual(TIME_ZONE_ERROR);
    expect(await countSubscriptions(jane.id)).toBe(0);
  });

  it("rejects a request without a session, from another site, or without a JSON body", async () => {
    const jane = await createAccount("jane");

    const signedOut = await createRoute(send("POST", "/api/subscriptions", MUSIC));
    const crossSite = await createRoute(
      send("POST", "/api/subscriptions", MUSIC, { cookie: jane.cookie, headers: { origin: "https://evil.example" } }),
    );
    const textPlain = await createRoute(
      send("POST", "/api/subscriptions", JSON.stringify(MUSIC), { cookie: jane.cookie, headers: { "content-type": "text/plain" } }),
    );
    const malformed = await createRoute(send("POST", "/api/subscriptions", "{", { cookie: jane.cookie }));

    expect([signedOut.status, crossSite.status, textPlain.status, malformed.status]).toEqual([401, 403, 400, 400]);
    expect(await json(signedOut)).toEqual(UNAUTHENTICATED);
    expect(await json(crossSite)).toEqual(FORBIDDEN);
    expect(await json(textPlain)).toEqual(INVALID_JSON);
    expect(await json(malformed)).toEqual(INVALID_JSON);
    expect(await countSubscriptions(jane.id)).toBe(0);
  });
});

describe("GET /api/subscriptions", () => {
  it("lists only the user's subscriptions with next billing dates and the average monthly cost", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    await create(jane);
    const yearly = await create(jane, { name: "Cloud storage", amountCents: 1200, billingCycle: "yearly", firstBillingDate: "2024-02-29" });
    const cancelled = await create(jane, { name: "Video plan", amountCents: 1599 });
    await setStatus(cancelled.id, { status: "cancelled", timeZone: NEW_YORK }, { cookie: jane.cookie });
    await create(sam, { name: "Sam's plan" });

    const response = await listRoute(get(`/api/subscriptions?timeZone=${encodeURIComponent(NEW_YORK)}`, jane.cookie));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      subscriptions: [
        expect.objectContaining({ id: yearly.id, name: "Cloud storage", status: "active", nextBillingDate: "2027-02-28" }),
        expect.objectContaining({ name: "Music plan", status: "active", nextBillingDate: "2026-10-31" }),
        // A cancelled subscription has no next charge.
        expect.objectContaining({ id: cancelled.id, name: "Video plan", status: "cancelled", nextBillingDate: null }),
      ],
      // $10.99 monthly + $12.00 / 12; the cancelled $15.99 counts for nothing.
      averageMonthlyCostCents: 1199,
    });
  });

  it("returns an empty list for a new account", async () => {
    const jane = await createAccount("jane");

    const response = await listRoute(get(`/api/subscriptions?timeZone=UTC`, jane.cookie));

    expect(await json(response)).toEqual({ subscriptions: [], averageMonthlyCostCents: 0 });
  });

  it("needs a session and a time zone", async () => {
    const jane = await createAccount("jane");

    const signedOut = await listRoute(get(`/api/subscriptions?timeZone=UTC`));
    const noTimeZone = await listRoute(get(`/api/subscriptions`, jane.cookie));

    expect(signedOut.status).toBe(401);
    expect(await json(signedOut)).toEqual(UNAUTHENTICATED);
    expect(noTimeZone.status).toBe(400);
    expect(await json(noTimeZone)).toEqual(TIME_ZONE_ERROR);
  });
});

describe("GET /api/subscriptions/{id}", () => {
  it("returns the user's subscription", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const response = await detail(saved.id, jane.cookie);

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      subscription: {
        id: saved.id,
        name: "Music plan",
        amountCents: 1099,
        billingCycle: "monthly",
        firstBillingDate: "2026-01-31",
        status: "active",
        nextBillingDate: "2026-10-31",
      },
    });
  });

  it("answers another user's, a missing, and a malformed id with the same 404", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const janes = await create(jane);

    for (const id of [janes.id, "00000000-0000-4000-8000-000000000000", "not-a-uuid"]) {
      const response = await detail(id, sam.cookie);
      expect(response.status).toBe(404);
      expect(await json(response)).toEqual(NOT_FOUND);
    }
  });

  it("needs a session and a time zone", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    expect((await detail(saved.id)).status).toBe(401);
    const noTimeZone = await detailRoute(get(`/api/subscriptions/${saved.id}`, jane.cookie), params(saved.id));
    expect(noTimeZone.status).toBe(400);
    expect(await json(noTimeZone)).toEqual(TIME_ZONE_ERROR);
  });
});

describe("PUT /api/subscriptions/{id}", () => {
  const EDIT = { name: "Family music", amountCents: 1699, billingCycle: "yearly", firstBillingDate: "2025-11-15", timeZone: NEW_YORK };

  it("replaces every field, keeps the status, and returns the new next billing date", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);
    await setStatus(saved.id, { status: "cancelled", timeZone: NEW_YORK }, { cookie: jane.cookie });

    const cancelledEdit = await editRoute(send("PUT", `/api/subscriptions/${saved.id}`, EDIT, { cookie: jane.cookie }), params(saved.id));
    expect(cancelledEdit.status).toBe(200);
    expect(await json(cancelledEdit)).toMatchObject({ subscription: { status: "cancelled", nextBillingDate: null } });

    await setStatus(saved.id, { status: "active", timeZone: NEW_YORK }, { cookie: jane.cookie });
    const activeEdit = await editRoute(send("PUT", `/api/subscriptions/${saved.id}`, EDIT, { cookie: jane.cookie }), params(saved.id));
    expect(await json(activeEdit)).toEqual({
      subscription: {
        id: saved.id,
        name: "Family music",
        amountCents: 1699,
        billingCycle: "yearly",
        firstBillingDate: "2025-11-15",
        status: "active",
        nextBillingDate: "2026-11-15",
      },
    });
  });

  it("answers field errors and leaves the saved subscription unchanged", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const response = await editRoute(
      send("PUT", `/api/subscriptions/${saved.id}`, { ...EDIT, amountCents: -1, name: "" }, { cookie: jane.cookie }),
      params(saved.id),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: { fields: { name: "Enter a service name.", amountCents: "Amount can’t be negative." } },
    });
    expect(await stored(saved.id)).toMatchObject({ name: "Music plan", amount_cents: 1099 });
  });

  it("never edits another user's subscription and answers it like a missing one", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const janes = await create(jane);

    const response = await editRoute(send("PUT", `/api/subscriptions/${janes.id}`, EDIT, { cookie: sam.cookie }), params(janes.id));

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual(NOT_FOUND);
    expect(await stored(janes.id)).toMatchObject({ name: "Music plan", billing_cycle: "monthly" });
  });

  it("rejects a request without a session, from another site, or without a JSON body", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);
    const path = `/api/subscriptions/${saved.id}`;

    const signedOut = await editRoute(send("PUT", path, EDIT), params(saved.id));
    const crossSite = await editRoute(send("PUT", path, EDIT, { cookie: jane.cookie, headers: { origin: "https://evil.example" } }), params(saved.id));
    const textPlain = await editRoute(
      send("PUT", path, JSON.stringify(EDIT), { cookie: jane.cookie, headers: { "content-type": "text/plain" } }),
      params(saved.id),
    );

    expect([signedOut.status, crossSite.status, textPlain.status]).toEqual([401, 403, 400]);
    expect(await stored(saved.id)).toMatchObject({ name: "Music plan" });
  });
});

describe("PUT /api/subscriptions/{id}/status", () => {
  it("cancels without a next charge, then reactivates from the original anchor", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const cancelled = await setStatus(saved.id, { status: "cancelled", timeZone: NEW_YORK }, { cookie: jane.cookie });
    expect(cancelled.status).toBe(200);
    expect(await json(cancelled)).toMatchObject({ subscription: { status: "cancelled", firstBillingDate: "2026-01-31", nextBillingDate: null } });
    expect(await stored(saved.id)).toMatchObject({ status: "cancelled", anchor: "2026-01-31" });

    // A month later the Jan 31 anchor gives Nov 30, then Dec 31: never a date carried over from a clamp.
    // Sessions last seven days, so Jane signs in again at the later time.
    const later = new Date("2026-11-20T12:00:00Z");
    vi.setSystemTime(later);
    const cookie = `${SESSION_COOKIE_NAME}=${await createSessionToken(jane.id, readSessionSecret(process.env), later)}`;
    const reactivated = await setStatus(saved.id, { status: "active", timeZone: NEW_YORK }, { cookie });
    expect(await json(reactivated)).toMatchObject({
      subscription: { status: "active", firstBillingDate: "2026-01-31", nextBillingDate: "2026-11-30" },
    });
  });

  it("treats sending the current status as success", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const response = await setStatus(saved.id, { status: "active", timeZone: NEW_YORK }, { cookie: jane.cookie });

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({ subscription: { status: "active" } });
  });

  it("rejects an unknown status or time zone", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const paused = await setStatus(saved.id, { status: "paused", timeZone: NEW_YORK }, { cookie: jane.cookie });
    const noTimeZone = await setStatus(saved.id, { status: "cancelled" }, { cookie: jane.cookie });

    expect(paused.status).toBe(400);
    expect(await json(paused)).toEqual({
      error: { code: "validation_failed", message: "Check the highlighted fields.", fields: { status: "Choose active or cancelled." } },
    });
    expect(noTimeZone.status).toBe(400);
    expect(await json(noTimeZone)).toEqual(TIME_ZONE_ERROR);
    expect(await stored(saved.id)).toMatchObject({ status: "active" });
  });

  it("never cancels or reactivates another user's subscription", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const janes = await create(jane);
    await setStatus(janes.id, { status: "cancelled", timeZone: NEW_YORK }, { cookie: jane.cookie });

    const response = await setStatus(janes.id, { status: "active", timeZone: NEW_YORK }, { cookie: sam.cookie });

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual(NOT_FOUND);
    expect(await stored(janes.id)).toMatchObject({ status: "cancelled" });
  });

  it("rejects a request without a session, from another site, or without a JSON body", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);
    const body = { status: "cancelled", timeZone: NEW_YORK };

    const signedOut = await setStatus(saved.id, body, {});
    const crossSite = await setStatus(saved.id, body, { cookie: jane.cookie, headers: { origin: "https://evil.example" } });
    const textPlain = await setStatus(saved.id, JSON.stringify(body), { cookie: jane.cookie, headers: { "content-type": "text/plain" } });

    expect([signedOut.status, crossSite.status, textPlain.status]).toEqual([401, 403, 400]);
    expect(await stored(saved.id)).toMatchObject({ status: "active" });
  });
});

describe("DELETE /api/subscriptions/{id}", () => {
  it("deletes the user's subscription, after which it is not found", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);

    const response = await deleteRoute(send("DELETE", `/api/subscriptions/${saved.id}`, undefined, { cookie: jane.cookie }), params(saved.id));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect((await detail(saved.id, jane.cookie)).status).toBe(404);
    const again = await deleteRoute(send("DELETE", `/api/subscriptions/${saved.id}`, undefined, { cookie: jane.cookie }), params(saved.id));
    expect(again.status).toBe(404);
  });

  it("never deletes another user's subscription", async () => {
    const jane = await createAccount("jane");
    const sam = await createAccount("sam");
    const janes = await create(jane);

    const response = await deleteRoute(send("DELETE", `/api/subscriptions/${janes.id}`, undefined, { cookie: sam.cookie }), params(janes.id));

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual(NOT_FOUND);
    expect(await countSubscriptions(jane.id)).toBe(1);
  });

  it("rejects a request without a session or from another site", async () => {
    const jane = await createAccount("jane");
    const saved = await create(jane);
    const path = `/api/subscriptions/${saved.id}`;

    const signedOut = await deleteRoute(send("DELETE", path, undefined), params(saved.id));
    const crossSite = await deleteRoute(
      send("DELETE", path, undefined, { cookie: jane.cookie, headers: { origin: "https://evil.example" } }),
      params(saved.id),
    );

    expect([signedOut.status, crossSite.status]).toEqual([401, 403]);
    expect(await countSubscriptions(jane.id)).toBe(1);
  });
});
