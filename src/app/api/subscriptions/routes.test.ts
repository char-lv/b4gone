// @vitest-environment node
// Branches of the subscription route handlers that the database-backed suite in tests/integration
// cannot reach easily, such as a database outage (issue #7). Written after the handlers; the happy
// paths and two-user checks run against PostgreSQL in tests/integration/subscriptions-api.test.ts.
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createSubscription: vi.fn(),
  listSubscriptions: vi.fn(),
  findSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  setSubscriptionStatus: vi.fn(),
  deleteSubscription: vi.fn(),
  getRequestUser: vi.fn(),
}));
vi.mock("@/features/subscriptions/subscription-repository", () => ({
  createSubscription: mocks.createSubscription,
  listSubscriptions: mocks.listSubscriptions,
  findSubscription: mocks.findSubscription,
  updateSubscription: mocks.updateSubscription,
  setSubscriptionStatus: mocks.setSubscriptionStatus,
  deleteSubscription: mocks.deleteSubscription,
}));
vi.mock("@/lib/auth/server-session", () => ({ getRequestUser: mocks.getRequestUser }));
vi.mock("@/lib/db/pool", () => ({ getPool: () => ({}) }));

const { GET: list, POST: create } = await import("./route");
const { DELETE: remove, GET: detail, PUT: edit } = await import("./[id]/route");
const { PUT: setStatus } = await import("./[id]/status/route");

const SITE = "https://b4gone.example";
const USER = { id: "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21", email: "jane@example.com" };
const ID = "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c";
const INPUT = { name: "Music plan", amountCents: 1099, billingCycle: "monthly", firstBillingDate: "2026-01-31" } as const;
const BODY = { ...INPUT, timeZone: "UTC" };
const SAVED = { id: ID, ...INPUT, status: "active" };
const params = { params: Promise.resolve({ id: ID }) };

function send(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    method,
    headers: { "content-type": "application/json", origin: SITE },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function get(path: string): NextRequest {
  return new NextRequest(`${SITE}${path}`);
}

describe("subscription route handlers", () => {
  let logged: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-24T02:30:00Z"));
    mocks.getRequestUser.mockResolvedValue(USER);
    logged = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("creates, edits, cancels, and deletes with the session user's id, never one from the body", async () => {
    mocks.createSubscription.mockResolvedValue(SAVED);
    mocks.updateSubscription.mockResolvedValue(SAVED);
    mocks.setSubscriptionStatus.mockResolvedValue({ ...SAVED, status: "cancelled" });
    mocks.deleteSubscription.mockResolvedValue(true);

    expect((await create(send("POST", "/api/subscriptions", { ...BODY, ownerId: "x" }))).status).toBe(201);
    expect(mocks.createSubscription).toHaveBeenCalledWith({}, USER.id, INPUT);
    expect((await edit(send("PUT", `/api/subscriptions/${ID}`, { ...BODY, ownerId: "x" }), params)).status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith({}, USER.id, ID, INPUT);
    const cancelled = await setStatus(send("PUT", `/api/subscriptions/${ID}/status`, { status: "cancelled", timeZone: "UTC" }), params);
    expect(await cancelled.json()).toEqual({ subscription: { ...SAVED, status: "cancelled", nextBillingDate: null } });
    expect(mocks.setSubscriptionStatus).toHaveBeenCalledWith({}, USER.id, ID, "cancelled");
    expect((await remove(send("DELETE", `/api/subscriptions/${ID}`), params)).status).toBe(204);
    expect(mocks.deleteSubscription).toHaveBeenCalledWith({}, USER.id, ID);
  });

  it.each([
    ["POST /api/subscriptions", () => create(send("POST", "/api/subscriptions", BODY)), mocks.createSubscription],
    ["GET /api/subscriptions", () => list(get("/api/subscriptions?timeZone=UTC")), mocks.listSubscriptions],
    ["GET /api/subscriptions/:id", () => detail(get(`/api/subscriptions/${ID}?timeZone=UTC`), params), mocks.findSubscription],
    ["PUT /api/subscriptions/:id", () => edit(send("PUT", `/api/subscriptions/${ID}`, BODY), params), mocks.updateSubscription],
    ["DELETE /api/subscriptions/:id", () => remove(send("DELETE", `/api/subscriptions/${ID}`), params), mocks.deleteSubscription],
    [
      "PUT /api/subscriptions/:id/status",
      () => setStatus(send("PUT", `/api/subscriptions/${ID}/status`, { status: "cancelled", timeZone: "UTC" }), params),
      mocks.setSubscriptionStatus,
    ],
  ])("%s answers a database failure with a generic 500 and logs only the error name", async (_label, call, query) => {
    query.mockRejectedValue(Object.assign(new Error(`connection to db.example failed for ${USER.email}`), { name: "DatabaseError" }));

    const response = await call();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "server_error", message: "Something went wrong. Please try again." } });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(String(logged.mock.calls[0][0])).toContain("DatabaseError");
    expect(String(logged.mock.calls[0][0])).not.toContain(USER.email);
  });

  it("answers a JSON body that is not an object with field errors and saves nothing", async () => {
    const created = await create(send("POST", "/api/subscriptions", ["Music plan"]));
    const edited = await edit(send("PUT", `/api/subscriptions/${ID}`, { timeZone: "UTC" }), params);
    const status = await setStatus(send("PUT", `/api/subscriptions/${ID}/status`, "cancelled"), params);

    expect(created.status).toBe(400);
    expect(await created.json()).toMatchObject({ error: { fields: { timeZone: expect.any(String) } } });
    expect(edited.status).toBe(400);
    expect(await edited.json()).toMatchObject({ error: { fields: { name: "Enter a service name." } } });
    expect(status.status).toBe(400);
    expect(await status.json()).toMatchObject({ error: { fields: { status: "Choose active or cancelled." } } });
    expect(mocks.createSubscription).not.toHaveBeenCalled();
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(mocks.setSubscriptionStatus).not.toHaveBeenCalled();
  });

  it("answers 404 when the repository finds nothing for this user", async () => {
    mocks.findSubscription.mockResolvedValue(null);
    mocks.updateSubscription.mockResolvedValue(null);
    mocks.setSubscriptionStatus.mockResolvedValue(null);
    mocks.deleteSubscription.mockResolvedValue(false);

    const responses = [
      await detail(get(`/api/subscriptions/${ID}?timeZone=UTC`), params),
      await edit(send("PUT", `/api/subscriptions/${ID}`, BODY), params),
      await setStatus(send("PUT", `/api/subscriptions/${ID}/status`, { status: "active", timeZone: "UTC" }), params),
      await remove(send("DELETE", `/api/subscriptions/${ID}`), params),
    ];

    expect(responses.map((response) => response.status)).toEqual([404, 404, 404, 404]);
    expect(mocks.findSubscription).toHaveBeenCalledWith({}, USER.id, ID);
  });

  it("answers 401 without a session before reading any record", async () => {
    mocks.getRequestUser.mockResolvedValue(null);

    const responses = [
      await list(get("/api/subscriptions?timeZone=UTC")),
      await detail(get(`/api/subscriptions/${ID}?timeZone=UTC`), params),
      await remove(send("DELETE", `/api/subscriptions/${ID}`), params),
    ];

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
    expect(mocks.listSubscriptions).not.toHaveBeenCalled();
    expect(mocks.findSubscription).not.toHaveBeenCalled();
    expect(mocks.deleteSubscription).not.toHaveBeenCalled();
  });
});
