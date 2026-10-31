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
