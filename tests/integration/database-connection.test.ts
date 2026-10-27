import { Client } from "pg";
import { readDatabaseUrl } from "@/lib/db/config";

// Connects to the isolated test database (issue #1). Schema, auth, and item API suites for
// #2, #4, and #6 build on this connection.
describe("isolated test database", () => {
  let client: Client | undefined;

  beforeAll(async () => {
    client = new Client({ connectionString: readDatabaseUrl(process.env, "test") });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  function connected(): Client {
    if (!client) throw new Error("The test database connection was not opened.");
    return client;
  }

  it("connects to a database whose name ends in _test", async () => {
    const result = await connected().query<{ name: string }>("select current_database() as name");
    expect(result.rows[0].name).toMatch(/_test$/);
  });

  it("uses PostgreSQL 17, the version in AGENTS.md", async () => {
    const result = await connected().query<{ server_version_num: string }>("show server_version_num");
    expect(Math.floor(Number(result.rows[0].server_version_num) / 10_000)).toBe(17);
  });

  it("can create a table and run parameterized queries inside a rolled-back transaction", async () => {
    const db = connected();
    await db.query("begin");
    try {
      await db.query("create table connection_check (id serial primary key, label text not null)");
      const label = "O'Brien; drop table connection_check; --";
      await db.query("insert into connection_check (label) values ($1)", [label]);
      const result = await db.query<{ label: string }>("select label from connection_check where label = $1", [label]);
      expect(result.rows).toEqual([{ label }]);
    } finally {
      await db.query("rollback");
    }
    const leftover = await db.query("select to_regclass('connection_check') as name");
    expect(leftover.rows[0].name).toBeNull();
  });
});
