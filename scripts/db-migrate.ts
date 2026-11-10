// Applies pending SQL migrations to DATABASE_URL (or TEST_DATABASE_URL with --test) (issue #2).
// Prints only the database name and applied versions, never the connection string or password.
// Run with `npm run db:migrate` or `npm run db:migrate -- --test`; Node strips the TypeScript types.
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { DatabaseConfigError, readDatabaseUrl, type DatabaseTarget } from "../src/lib/db/config.ts";
import { applyMigrations } from "./lib/migrations.ts";

const target: DatabaseTarget = process.argv.includes("--test") ? "test" : "app";
const directory = fileURLToPath(new URL("../db/migrations", import.meta.url));

try {
  const client = new Client({ connectionString: readDatabaseUrl(process.env, target), connectionTimeoutMillis: 10_000 });
  await client.connect();
  try {
    const database = (await client.query<{ name: string }>("select current_database() as name")).rows[0].name;
    const applied = await applyMigrations(client, directory);
    console.log(
      applied.length > 0
        ? `Applied ${applied.length} migration(s) to "${database}": ${applied.join(", ")}`
        : `"${database}" is up to date.`,
    );
  } finally {
    await client.end();
  }
} catch (error) {
  if (error instanceof DatabaseConfigError) {
    console.error(error.message);
  } else {
    const reason = error instanceof Error && error.message ? error.message : "unknown error";
    console.error(`Could not migrate the ${target} database: ${reason}`);
  }
  process.exitCode = 1;
}
