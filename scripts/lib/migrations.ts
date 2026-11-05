// Applies the ordered SQL files in db/migrations (issue #2). Shared by `npm run db:migrate` and the
// integration test setup. Node strips the TypeScript types, so keep imports relative with extensions.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type MigrationClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type MigrationOptions = {
  /** History table that records applied versions. Tests pass their own to stay isolated. */
  table?: string;
};

const MIGRATION_FILE = /^\d{3}_[a-z0-9_]+\.sql$/;
// Any fixed key works; it only has to be the same for every process that runs migrations.
const ADVISORY_LOCK_KEY = 4_620_260;

/** Returns the migration file names in the order they must run. */
export function selectMigrationFiles(fileNames: readonly string[]): string[] {
  return fileNames.filter((name) => MIGRATION_FILE.test(name)).sort();
}

/** Applies every migration that is not yet recorded and returns the versions it applied. */
export async function applyMigrations(
  client: MigrationClient,
  directory: string,
  options: MigrationOptions = {},
): Promise<string[]> {
  const table = options.table ?? "schema_migrations";
  const files = selectMigrationFiles(await readdir(directory));
  const applied: string[] = [];

  await client.query("select pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
  try {
    await client.query(
      `create table if not exists ${table} (version text primary key, applied_at timestamptz not null default now())`,
    );
    const done = await client.query(`select version from ${table}`);
    const recorded = new Set(done.rows.map((row) => String(row.version)));

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (recorded.has(version)) continue;
      const sql = await readFile(path.join(directory, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(`insert into ${table} (version) values ($1)`, [version]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Migration ${version} failed: ${reason}`);
      }
      applied.push(version);
    }
  } finally {
    await client.query("select pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
  }
  return applied;
}
