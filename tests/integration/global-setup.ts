import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { loadEnv } from "vite";
import { readDatabaseUrl } from "../../src/lib/db/config";
import { applyMigrations } from "../../scripts/lib/migrations";

// Brings the isolated test database up to the current schema before any suite runs (issue #2).
export default async function setup(): Promise<void> {
  const env = { ...loadEnv("test", process.cwd(), ""), ...process.env };
  const client = new Client({ connectionString: readDatabaseUrl(env, "test") });
  await client.connect();
  try {
    await applyMigrations(client, fileURLToPath(new URL("../../db/migrations", import.meta.url)));
  } finally {
    await client.end();
  }
}
