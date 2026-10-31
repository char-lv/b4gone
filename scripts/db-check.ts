// Checks that DATABASE_URL (or TEST_DATABASE_URL with --test) accepts connections (issue #1).
// Prints the database, user, and server version only, never the connection string or password.
// Run with `npm run db:check` or `npm run db:check -- --test`; Node strips the TypeScript types.
import { Client } from "pg";
import { DatabaseConfigError, readDatabaseUrl, type DatabaseTarget } from "../src/lib/db/config.ts";

const target: DatabaseTarget = process.argv.includes("--test") ? "test" : "app";

type ServerInfo = { database: string; user: string; version: string };

async function checkConnection(): Promise<ServerInfo> {
  const client = new Client({
    connectionString: readDatabaseUrl(process.env, target),
    connectionTimeoutMillis: 10_000,
  });
  await client.connect();
  try {
    const result = await client.query<ServerInfo>(
      "select current_database() as database, current_user as user, current_setting('server_version') as version",
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

try {
  const { database, user, version } = await checkConnection();
  console.log(`Connected to the ${target} database "${database}" as "${user}" (PostgreSQL ${version}).`);
} catch (error) {
  if (error instanceof DatabaseConfigError) {
    console.error(error.message);
  } else {
    const reason = error instanceof Error && error.message ? error.message : "unknown error";
    console.error(`Could not connect to the ${target} database: ${reason}`);
  }
  process.exitCode = 1;
}
