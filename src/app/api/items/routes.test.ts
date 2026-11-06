// @vitest-environment node
// Branches of the item route handlers that the database-backed suite in tests/integration cannot
// reach easily, such as a database outage. The happy paths are covered there against PostgreSQL.
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createItem: vi.fn(),
  listItems: vi.fn(),
  findItem: vi.fn(),
  getRequestUser: vi.fn(),
}));
vi.mock("@/features/items/item-repository", () => ({
  createItem: mocks.createItem,
  listItems: mocks.listItems,
  findItem: mocks.findItem,
}));
vi.mock("@/lib/auth/server-session", () => ({ getRequestUser: mocks.getRequestUser }));
vi.mock("@/lib/db/pool", () => ({ getPool: () => ({}) }));

const { GET: list, POST: create } = await import("./route");
const { GET: detail } = await import("./[id]/route");

const SITE = "https://b4gone.example";
const USER = { id: "4b3f3f0c-6a51-4c39-9a64-2f0f6f1d8e21", email: "jane@example.com" };
const ITEM_ID = "9d7a1c52-0d6f-4f4e-8a9b-3c1e2f4a5b6c";
const BODY = { name: "Wool coat", purchaseDate: "2026-10-09", priceCents: null, timeZone: "UTC" };

function post(body: unknown): NextRequest {
  return new NextRequest(`${SITE}/api/items`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE },
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: ITEM_ID }) };

describe("item route handlers", () => {
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

  it("saves with the session user's id and the validated fields", async () => {
    mocks.createItem.mockResolvedValue({ id: ITEM_ID });

    const response = await create(post({ ...BODY, name: "  Wool coat ", ownerId: "someone-else" }));

    expect(response.status).toBe(201);
    expect(mocks.createItem).toHaveBeenCalledWith({}, USER.id, {
      name: "Wool coat",
      purchaseDate: "2026-10-09",
      priceCents: null,
      returnDeadline: null,
      warrantyExpiration: null,
    });
  });

  it("rejects a JSON body that is not an object as a missing time zone", async () => {
    const response = await create(post(["not", "an", "item"]));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { fields: { timeZone: expect.any(String) } } });
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it.each([
    ["POST /api/items", () => create(post(BODY)), mocks.createItem],
    ["GET /api/items", () => list(new NextRequest(`${SITE}/api/items`)), mocks.listItems],
    ["GET /api/items/:id", () => detail(new NextRequest(`${SITE}/api/items/${ITEM_ID}`), params), mocks.findItem],
  ])("%s answers a database failure with a generic 500 and logs only the error name", async (_label, call, query) => {
    query.mockRejectedValue(Object.assign(new Error(`connection to db.example failed for ${USER.email}`), { name: "DatabaseError" }));

    const response = await call();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "server_error", message: "Something went wrong. Please try again." } });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(String(logged.mock.calls[0][0])).not.toContain(USER.email);
  });

  it("answers 401 without a session and 404 for an item the user does not have", async () => {
    mocks.getRequestUser.mockResolvedValue(null);
    expect((await create(post(BODY))).status).toBe(401);
    expect((await list(new NextRequest(`${SITE}/api/items`))).status).toBe(401);
    expect((await detail(new NextRequest(`${SITE}/api/items/${ITEM_ID}`), params)).status).toBe(401);
    expect(mocks.createItem).not.toHaveBeenCalled();

    mocks.getRequestUser.mockResolvedValue(USER);
    mocks.findItem.mockResolvedValue(null);
    const missing = await detail(new NextRequest(`${SITE}/api/items/${ITEM_ID}`), params);
    expect(missing.status).toBe(404);
    expect(mocks.findItem).toHaveBeenCalledWith({}, USER.id, ITEM_ID);
  });

  it("answers a failing session lookup with a 500 too", async () => {
    mocks.getRequestUser.mockRejectedValue(new Error("SESSION_SECRET is not set"));

    expect((await list(new NextRequest(`${SITE}/api/items`))).status).toBe(500);
    expect((await detail(new NextRequest(`${SITE}/api/items/${ITEM_ID}`), params)).status).toBe(500);
  });
});
