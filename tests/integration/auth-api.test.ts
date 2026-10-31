import { NextRequest } from "next/server";
import { Client } from "pg";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as register } from "@/app/api/auth/register/route";
import { readDatabaseUrl } from "@/lib/db/config";

// Registration, sign-in, sign-out, and session lookup against the test database (issue #2).
const SITE = "http://localhost:3000";
const DOMAIN = "auth-test.example";
const PASSWORD = "correct horse battery";

type Handler = (request: NextRequest) => Promise<Response>;

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function getRequest(path: string, cookie?: string): NextRequest {
  return new NextRequest(`${SITE}${path}`, { headers: cookie ? { cookie } : {} });
}

function sessionCookie(response: Response): string | undefined {
  return response.headers.getSetCookie().find((value) => value.startsWith("b4gone_session="));
}

/** Turns a Set-Cookie value into the Cookie header a browser would send back. */
function cookieHeader(response: Response): string {
  const cookie = sessionCookie(response);
  if (!cookie) throw new Error("The response did not set a session cookie.");
  return cookie.split(";")[0];
}

async function call(handler: Handler, request: NextRequest): Promise<{ response: Response; body: unknown }> {
  const response = await handler(request);
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

async function registerUser(name: string): Promise<{ email: string; cookie: string; id: string }> {
  const email = `${name}@${DOMAIN}`;
  const { response, body } = await call(register, jsonRequest("/api/auth/register", { email, password: PASSWORD }));
  expect(response.status).toBe(201);
  return { email, cookie: cookieHeader(response), id: (body as { user: { id: string } }).user.id };
}

let db: Client | undefined;
const logged: string[] = [];

function database(): Client {
  if (!db) throw new Error("The test database connection was not opened.");
  return db;
}

beforeAll(async () => {
  db = new Client({ connectionString: readDatabaseUrl(process.env, "test") });
  await db.connect();
  for (const method of ["log", "info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    });
  }
});

beforeEach(async () => {
  await database().query("delete from users where email like $1", [`%@${DOMAIN}`]);
});

afterAll(async () => {
  await database().query("delete from users where email like $1", [`%@${DOMAIN}`]);
  await db?.end();
  vi.restoreAllMocks();
});

describe("POST /api/auth/register", () => {
  it("creates one account, returns the user without secrets, and starts a session", async () => {
    const { response, body } = await call(
      register,
      jsonRequest("/api/auth/register", { email: `  New.User@${DOMAIN.toUpperCase()} `, password: PASSWORD }),
    );

    expect(response.status).toBe(201);
    expect(body).toEqual({ user: { id: expect.any(String), email: `new.user@${DOMAIN}` } });
    expect(JSON.stringify(body)).not.toMatch(/password|hash/i);

    const cookie = sessionCookie(response);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);

    const rows = await database().query<{ email: string; password_hash: string }>(
      "select email, password_hash from users where email like $1",
      [`%@${DOMAIN}`],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].password_hash).toMatch(/^\$2[aby]\$12\$/);
    expect(rows.rows[0].password_hash).not.toContain(PASSWORD);
  });

  it("returns field errors for invalid input and creates nothing", async () => {
    const { response, body } = await call(
      register,
      jsonRequest("/api/auth/register", { email: "not-an-email", password: "short" }),
    );

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: {
          email: "Enter a valid email address, like name@example.com.",
          password: "Password must be at least 8 characters.",
        },
      },
    });
    expect(sessionCookie(response)).toBeUndefined();
  });

  it("rejects a body that is not JSON", async () => {
    const { response, body } = await call(register, jsonRequest("/api/auth/register", "{not json"));

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: { code: "invalid_json", message: "Send the request body as JSON." } });
  });

  it("refuses a second account for the same email, ignoring case", async () => {
    await registerUser("taken");

    const { response, body } = await call(
      register,
      jsonRequest("/api/auth/register", { email: `TAKEN@${DOMAIN}`, password: "another password" }),
    );

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: {
        code: "email_taken",
        message: "Check the highlighted fields.",
        fields: { email: "An account with this email already exists. Sign in instead." },
      },
    });
    expect(sessionCookie(response)).toBeUndefined();
  });

  it("rejects a cross-origin request before touching the database", async () => {
    const { response, body } = await call(
      register,
      jsonRequest("/api/auth/register", { email: `evil@${DOMAIN}`, password: PASSWORD }, { origin: "https://evil.example" }),
    );

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: { code: "forbidden_origin", message: "This request must come from the B4Gone site." } });
    const rows = await database().query("select 1 from users where email = $1", [`evil@${DOMAIN}`]);
    expect(rows.rowCount).toBe(0);
  });
});

describe("POST /api/auth/login", () => {
  it("signs in with the right password, ignoring email case and spaces", async () => {
    const { id } = await registerUser("jane");

    const { response, body } = await call(
      login,
      jsonRequest("/api/auth/login", { email: ` JANE@${DOMAIN} `, password: PASSWORD }),
    );

    expect(response.status).toBe(200);
    expect(body).toEqual({ user: { id, email: `jane@${DOMAIN}` } });
    expect(sessionCookie(response)).toMatch(/HttpOnly/i);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await registerUser("jane");

    const wrongPassword = await call(login, jsonRequest("/api/auth/login", { email: `jane@${DOMAIN}`, password: "wrong password" }));
    const unknownEmail = await call(login, jsonRequest("/api/auth/login", { email: `nobody@${DOMAIN}`, password: PASSWORD }));

    const expected = { error: { code: "invalid_credentials", message: "Invalid email or password." } };
    expect(wrongPassword.response.status).toBe(401);
    expect(wrongPassword.body).toEqual(expected);
    expect(unknownEmail.response.status).toBe(401);
    expect(unknownEmail.body).toEqual(expected);
    expect(sessionCookie(wrongPassword.response)).toBeUndefined();
    expect(sessionCookie(unknownEmail.response)).toBeUndefined();
  });

  it("returns field errors when a field is empty", async () => {
    const { response, body } = await call(login, jsonRequest("/api/auth/login", { email: "", password: "" }));

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: { code: "validation_failed", fields: { email: "Enter your email address.", password: "Enter your password." } },
    });
  });

  it("rejects a cross-origin request", async () => {
    await registerUser("jane");

    const { response } = await call(
      login,
      jsonRequest("/api/auth/login", { email: `jane@${DOMAIN}`, password: PASSWORD }, { origin: "https://evil.example" }),
    );

    expect(response.status).toBe(403);
    expect(sessionCookie(response)).toBeUndefined();
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a request without a session", async () => {
    const { response, body } = await call(me, getRequest("/api/auth/me"));

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: { code: "unauthenticated", message: "Sign in to continue." } });
  });

  it("rejects a tampered session cookie", async () => {
    const { cookie } = await registerUser("jane");

    const { response } = await call(me, getRequest("/api/auth/me", `${cookie}x`));

    expect(response.status).toBe(401);
  });

  it("rejects a valid token whose account no longer exists", async () => {
    const { cookie, id } = await registerUser("gone");
    await database().query("delete from users where id = $1", [id]);

    const { response } = await call(me, getRequest("/api/auth/me", cookie));

    expect(response.status).toBe(401);
  });

  it("keeps two users apart and ignores any user ID the client sends", async () => {
    const alice = await registerUser("alice");
    const bob = await registerUser("bob");

    const asAlice = await call(me, getRequest(`/api/auth/me?userId=${bob.id}`, alice.cookie));
    const asBob = await call(me, getRequest(`/api/auth/me?userId=${alice.id}`, bob.cookie));

    expect(asAlice.body).toEqual({ user: { id: alice.id, email: alice.email } });
    expect(asBob.body).toEqual({ user: { id: bob.id, email: bob.email } });
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const { cookie } = await registerUser("jane");

    const response = await logout(jsonRequest("/api/auth/logout", {}, { cookie }));

    expect(response.status).toBe(204);
    expect(sessionCookie(response)).toMatch(/Max-Age=0/);
  });

  it("rejects a cross-origin request so another site cannot sign the user out", async () => {
    const response = await logout(jsonRequest("/api/auth/logout", {}, { origin: "https://evil.example" }));

    expect(response.status).toBe(403);
    expect(sessionCookie(response)).toBeUndefined();
  });
});

describe("logging", () => {
  it("never logs passwords or session tokens", async () => {
    const { cookie } = await registerUser("logger");
    await call(login, jsonRequest("/api/auth/login", { email: `logger@${DOMAIN}`, password: "wrong password" }));
    const token = cookie.split("=")[1];

    for (const line of logged) {
      expect(line).not.toContain(PASSWORD);
      expect(line).not.toContain("wrong password");
      expect(line).not.toContain(token);
    }
  });
});
