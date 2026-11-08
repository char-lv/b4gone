import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { readDatabaseUrl } from "@/lib/db/config";
import { applyMigrations, selectMigrationFiles } from "../../scripts/lib/migrations";

// Versioned SQL migrations (issue #2). The scratch cases use their own schema and history table so
// they never touch the real schema_migrations records.
const MIGRATIONS_DIR = fileURLToPath(new URL("../../db/migrations", import.meta.url));
const SCRATCH_SCHEMA = "migration_check";
const SCRATCH_TABLE = `${SCRATCH_SCHEMA}.history`;

describe("selectMigrationFiles", () => {
  it("keeps numbered .sql files in version order and ignores everything else", () => {
    expect(
      selectMigrationFiles(["010_later.sql", "README.md", "002_second.sql", "001_first.sql", "3_bad.sql", ".keep"]),
    ).toEqual(["001_first.sql", "002_second.sql", "010_later.sql"]);
  });
});

describe("applyMigrations", () => {
  let client: Client | undefined;
  let scratchDir = "";

  beforeAll(async () => {
    client = new Client({ connectionString: readDatabaseUrl(process.env, "test") });
    await client.connect();
  });

  beforeEach(async () => {
    await connected().query(`drop schema if exists ${SCRATCH_SCHEMA} cascade`);
    await connected().query(`create schema ${SCRATCH_SCHEMA}`);
    scratchDir = await mkdtemp(path.join(tmpdir(), "b4gone-migrations-"));
  });

  afterEach(async () => {
    await connected().query(`drop schema if exists ${SCRATCH_SCHEMA} cascade`);
    await rm(scratchDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await client?.end();
  });

  function connected(): Client {
    if (!client) throw new Error("The test database connection was not opened.");
    return client;
  }

  async function writeMigration(name: string, sql: string): Promise<void> {
    await writeFile(path.join(scratchDir, name), sql);
  }

  it("applies pending files in order once and records each version", async () => {
    await writeMigration("001_create_notes.sql", `create table ${SCRATCH_SCHEMA}.notes (id int primary key);`);
    await writeMigration("002_add_label.sql", `alter table ${SCRATCH_SCHEMA}.notes add column label text;`);

    const first = await applyMigrations(connected(), scratchDir, { table: SCRATCH_TABLE });
    const second = await applyMigrations(connected(), scratchDir, { table: SCRATCH_TABLE });

    expect(first).toEqual(["001_create_notes", "002_add_label"]);
    expect(second).toEqual([]);
    const history = await connected().query(`select version from ${SCRATCH_TABLE} order by version`);
    expect(history.rows.map((row) => row.version)).toEqual(["001_create_notes", "002_add_label"]);
  });

  it("rolls back a failing migration and leaves it unrecorded", async () => {
    await writeMigration("001_create_notes.sql", `create table ${SCRATCH_SCHEMA}.notes (id int primary key);`);
    await writeMigration(
      "002_broken.sql",
      `create table ${SCRATCH_SCHEMA}.partial (id int); select * from ${SCRATCH_SCHEMA}.missing_table;`,
    );

    await expect(applyMigrations(connected(), scratchDir, { table: SCRATCH_TABLE })).rejects.toThrow(
      /002_broken/,
    );

    const history = await connected().query(`select version from ${SCRATCH_TABLE}`);
    expect(history.rows.map((row) => row.version)).toEqual(["001_create_notes"]);
    const partial = await connected().query("select to_regclass($1) as name", [`${SCRATCH_SCHEMA}.partial`]);
    expect(partial.rows[0].name).toBeNull();
  });

  it("creates the users table from the project migrations", async () => {
    await applyMigrations(connected(), MIGRATIONS_DIR);

    const columns = await connected().query<{ column_name: string; is_nullable: string }>(
      `select column_name, is_nullable from information_schema.columns
       where table_schema = 'public' and table_name = 'users' order by ordinal_position`,
    );
    expect(columns.rows).toEqual([
      { column_name: "id", is_nullable: "NO" },
      { column_name: "email", is_nullable: "NO" },
      { column_name: "password_hash", is_nullable: "NO" },
      { column_name: "created_at", is_nullable: "NO" },
    ]);
  });

  it("stores emails in lowercase and keeps them unique", async () => {
    await applyMigrations(connected(), MIGRATIONS_DIR);
    const db = connected();
    await db.query("begin");
    try {
      await db.query("insert into users (email, password_hash) values ($1, $2)", ["case@example.test", "hash"]);
      await expect(
        db.query("insert into users (email, password_hash) values ($1, $2)", ["case@example.test", "hash"]),
      ).rejects.toMatchObject({ code: "23505" });
    } finally {
      await db.query("rollback");
    }
    await db.query("begin");
    try {
      await expect(
        db.query("insert into users (email, password_hash) values ($1, $2)", ["Upper@Example.test", "hash"]),
      ).rejects.toMatchObject({ code: "23514" });
    } finally {
      await db.query("rollback");
    }
  });
});

// The items table (issue #4): one owner per item, date-only columns, and the item rules repeated as
// constraints so a bug in the application cannot store an impossible record.
describe("items table", () => {
  let client: Client | undefined;

  beforeAll(async () => {
    client = new Client({ connectionString: readDatabaseUrl(process.env, "test") });
    await client.connect();
    await applyMigrations(client, MIGRATIONS_DIR);
  });

  afterAll(async () => {
    await client?.end();
  });

  function db(): Client {
    if (!client) throw new Error("The test database connection was not opened.");
    return client;
  }

  /** Runs the statements inside a transaction that is always rolled back. */
  async function inRollback(run: (ownerId: string) => Promise<void>): Promise<void> {
    await db().query("begin");
    try {
      const owner = await db().query<{ id: string }>(
        "insert into users (email, password_hash) values ($1, $2) returning id",
        ["items-owner@example.test", "hash"],
      );
      await run(owner.rows[0].id);
    } finally {
      await db().query("rollback");
    }
  }

  async function insertItem(ownerId: string, values: Record<string, unknown>): Promise<void> {
    const row = { owner_id: ownerId, name: "Wool coat", purchase_date: "2026-10-09", ...values };
    const columns = Object.keys(row);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    await db().query(
      `insert into items (${columns.join(", ")}) values (${placeholders.join(", ")})`,
      Object.values(row),
    );
  }

  async function expectRejected(values: Record<string, unknown>, code: string): Promise<void> {
    await inRollback(async (ownerId) => {
      await expect(insertItem(ownerId, values)).rejects.toMatchObject({ code });
    });
  }

  it("has the item columns with date-only deadlines and integer cents", async () => {
    const columns = await db().query<{ column_name: string; data_type: string; is_nullable: string }>(
      `select column_name, data_type, is_nullable from information_schema.columns
       where table_schema = 'public' and table_name = 'items' order by ordinal_position`,
    );

    expect(columns.rows).toEqual([
      { column_name: "id", data_type: "uuid", is_nullable: "NO" },
      { column_name: "owner_id", data_type: "uuid", is_nullable: "NO" },
      { column_name: "name", data_type: "text", is_nullable: "NO" },
      { column_name: "purchase_date", data_type: "date", is_nullable: "NO" },
      { column_name: "price_cents", data_type: "integer", is_nullable: "YES" },
      { column_name: "return_deadline", data_type: "date", is_nullable: "YES" },
      { column_name: "warranty_expiration", data_type: "date", is_nullable: "YES" },
      { column_name: "status", data_type: "text", is_nullable: "NO" },
      { column_name: "created_at", data_type: "timestamp with time zone", is_nullable: "NO" },
      { column_name: "updated_at", data_type: "timestamp with time zone", is_nullable: "NO" },
    ]);
  });

  it("starts new items as active and keeps a blank price distinct from zero", async () => {
    await inRollback(async (ownerId) => {
      await insertItem(ownerId, { name: "Gift card", price_cents: 0 });
      await insertItem(ownerId, { name: "Receipt lost" });

      const rows = await db().query<{ name: string; price_cents: number | null; status: string }>(
        "select name, price_cents, status from items where owner_id = $1 order by name",
        [ownerId],
      );
      expect(rows.rows).toEqual([
        { name: "Gift card", price_cents: 0, status: "active" },
        { name: "Receipt lost", price_cents: null, status: "active" },
      ]);
    });
  });

  it("accepts deadlines on the purchase date and the largest price", async () => {
    await inRollback(async (ownerId) => {
      await insertItem(ownerId, {
        price_cents: 99_999_999,
        return_deadline: "2026-10-09",
        warranty_expiration: "2026-10-09",
        status: "returned",
      });
    });
  });

  it.each([
    ["an owner that does not exist", { owner_id: "00000000-0000-4000-8000-000000000000" }, "23503"],
    ["an empty name", { name: "" }, "23514"],
    ["a name over 100 characters", { name: "x".repeat(101) }, "23514"],
    ["a negative price", { price_cents: -1 }, "23514"],
    ["a price over $999,999.99", { price_cents: 100_000_000 }, "23514"],
    ["a return deadline before the purchase", { return_deadline: "2026-10-08" }, "23514"],
    ["a warranty expiration before the purchase", { warranty_expiration: "2026-10-08" }, "23514"],
    ["an unknown status", { status: "lost" }, "23514"],
  ])("rejects %s", async (_label, values, code) => {
    await expectRejected(values, code);
  });

  it("counts characters, not bytes, toward the 100-character name limit", async () => {
    await inRollback(async (ownerId) => {
      await insertItem(ownerId, { name: "é".repeat(100) });
    });
  });

  it("deletes a user's items with the account", async () => {
    await inRollback(async (ownerId) => {
      await insertItem(ownerId, {});
      await db().query("delete from users where id = $1", [ownerId]);

      const left = await db().query("select count(*)::int as count from items where owner_id = $1", [ownerId]);
      expect(left.rows[0].count).toBe(0);
    });
  });
});
