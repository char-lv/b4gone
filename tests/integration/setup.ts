import { Pool } from "pg";
import { afterAll, vi } from "vitest";
import { readDatabaseUrl } from "@/lib/db/config";

// Route handlers read their pool from @/lib/db/pool. Integration suites swap it for a pool on
// TEST_DATABASE_URL so they never connect to DATABASE_URL (issue #2).
const testPool = new Pool({ connectionString: readDatabaseUrl(process.env, "test"), max: 4 });

vi.mock("@/lib/db/pool", () => ({ getPool: () => testPool }));

// A throwaway signing secret for these tests only.
process.env.SESSION_SECRET ??= "integration-test-session-secret-0123456789";

afterAll(async () => {
  await testPool.end();
});
