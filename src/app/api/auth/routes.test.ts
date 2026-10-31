// @vitest-environment node
// Branches of the auth route handlers that the database-backed suite in tests/integration cannot
// reach easily, such as a database outage. The happy paths are covered there against PostgreSQL.
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  authenticate: vi.fn(),
  getRequestUser: vi.fn(),
}));
vi.mock("@/features/auth/auth-service", () => ({
  registerUser: mocks.registerUser,
  authenticate: mocks.authenticate,
}));
vi.mock("@/lib/auth/server-session", () => ({
  startSession: vi.fn(async () => {}),
  endSession: vi.fn(),
  getRequestUser: mocks.getRequestUser,
}));
vi.mock("@/lib/db/pool", () => ({ getPool: () => ({}) }));

const { POST: register } = await import("./register/route");
const { POST: login } = await import("./login/route");
const { GET: me } = await import("./me/route");

const SITE = "https://b4gone.example";
const CREDENTIALS = { email: "jane@example.com", password: "correct horse" };

function post(path: string, body: string): NextRequest {
  return new NextRequest(`${SITE}${path}`, { method: "POST", headers: { origin: SITE }, body });
}

describe("auth route handlers", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a generic 500 when registration fails unexpectedly", async () => {
    mocks.registerUser.mockRejectedValue(new Error("connection refused"));

    const response = await register(post("/api/auth/register", JSON.stringify(CREDENTIALS)));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "server_error" } });
  });

  it("rejects malformed JSON and returns a generic 500 when sign-in fails unexpectedly", async () => {
    expect((await login(post("/api/auth/login", "{nope"))).status).toBe(400);

    mocks.authenticate.mockRejectedValue(new Error("connection refused"));
    expect((await login(post("/api/auth/login", JSON.stringify(CREDENTIALS)))).status).toBe(500);
  });

  it("returns a generic 500 when the session lookup fails", async () => {
    mocks.getRequestUser.mockRejectedValue(new Error("connection refused"));

    const response = await me(new NextRequest(`${SITE}/api/auth/me`));

    expect(response.status).toBe(500);
  });
});

describe("auth route handlers on the success path", () => {
  it("creates the account with 201, signs in with 200, and signs out with 204", async () => {
    const { POST: logout } = await import("./logout/route");
    mocks.registerUser.mockResolvedValue({ id: "u1", email: CREDENTIALS.email });
    mocks.authenticate.mockResolvedValueOnce({ id: "u1", email: CREDENTIALS.email }).mockResolvedValueOnce(null);
    mocks.getRequestUser.mockResolvedValue(null);

    expect((await register(post("/api/auth/register", JSON.stringify(CREDENTIALS)))).status).toBe(201);
    expect((await register(post("/api/auth/register", "{}"))).status).toBe(400);
    expect((await login(post("/api/auth/login", JSON.stringify(CREDENTIALS)))).status).toBe(200);
    expect((await login(post("/api/auth/login", JSON.stringify(CREDENTIALS)))).status).toBe(401);
    expect((await me(new NextRequest(`${SITE}/api/auth/me`))).status).toBe(401);
    expect((await logout(post("/api/auth/logout", ""))).status).toBe(204);
  });
});
