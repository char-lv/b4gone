// Shared PostgreSQL pool for route handlers and Server Components (issue #2). The connection string
// is read on first use, so builds and pages that never query the database do not need it.
import "server-only";
import { Pool } from "pg";
import { readDatabaseUrl } from "./config";

const globalForPool = globalThis as typeof globalThis & { b4gonePool?: Pool };

export function getPool(): Pool {
  // Reuse one pool across hot reloads in development instead of opening new connections each time.
  globalForPool.b4gonePool ??= new Pool({ connectionString: readDatabaseUrl(process.env, "app"), max: 5 });
  return globalForPool.b4gonePool;
}
