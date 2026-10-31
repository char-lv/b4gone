// @vitest-environment node
import { Pool } from "pg";

const created = vi.hoisted(() => [] as unknown[]);
vi.mock("pg", () => ({
  Pool: class {
    constructor(options: unknown) {
      created.push(options);
    }
  },
}));

const { getPool } = await import("./pool");

describe("getPool", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates one pool from DATABASE_URL on first use and reuses it", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/b4gone_dev");

    const first = getPool();
    const second = getPool();

    expect(first).toBe(second);
    expect(first).toBeInstanceOf(Pool);
    expect(created).toEqual([{ connectionString: "postgresql://user:pass@localhost:5432/b4gone_dev", max: 5 }]);
  });
});
