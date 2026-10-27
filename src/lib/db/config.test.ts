// @vitest-environment node
import { DatabaseConfigError, readDatabaseUrl } from "./config";

const DEV_URL = "postgresql://b4gone:s3cret-pw@localhost:5432/b4gone_dev";
const TEST_URL = "postgresql://b4gone:s3cret-pw@localhost:5432/b4gone_test";

function errorFrom(run: () => unknown): DatabaseConfigError {
  try {
    run();
  } catch (error) {
    if (error instanceof DatabaseConfigError) return error;
    throw error;
  }
  throw new Error("Expected a DatabaseConfigError");
}

describe("readDatabaseUrl for the app database", () => {
  it("returns DATABASE_URL for a postgresql:// URL that names a database", () => {
    expect(readDatabaseUrl({ DATABASE_URL: DEV_URL }, "app")).toBe(DEV_URL);
  });

  it("accepts the postgres:// scheme and connection options", () => {
    const url = "postgres://b4gone:s3cret-pw@db.example.com/b4gone?sslmode=require";
    expect(readDatabaseUrl({ DATABASE_URL: url }, "app")).toBe(url);
  });

  it("trims surrounding whitespace from the value", () => {
    expect(readDatabaseUrl({ DATABASE_URL: `  ${DEV_URL}\n` }, "app")).toBe(DEV_URL);
  });

  it.each([undefined, "", "   "])("explains how to set a missing DATABASE_URL (%j)", (value) => {
    expect(() => readDatabaseUrl({ DATABASE_URL: value }, "app")).toThrow(
      new DatabaseConfigError("DATABASE_URL is not set. Copy .env.example to .env.local and set it."),
    );
  });

  it("rejects a value that is not a URL", () => {
    expect(() => readDatabaseUrl({ DATABASE_URL: "localhost:5432 b4gone_dev" }, "app")).toThrow(
      new DatabaseConfigError("DATABASE_URL is not a valid connection URL."),
    );
  });

  it("rejects a non-PostgreSQL scheme", () => {
    expect(() => readDatabaseUrl({ DATABASE_URL: "mysql://b4gone:s3cret-pw@localhost/b4gone_dev" }, "app")).toThrow(
      new DatabaseConfigError("DATABASE_URL must start with postgres:// or postgresql://."),
    );
  });

  it.each(["postgresql://b4gone:s3cret-pw@localhost:5432", "postgresql://b4gone:s3cret-pw@localhost:5432/"])(
    "rejects a URL without a database name (%s)",
    (value) => {
      expect(() => readDatabaseUrl({ DATABASE_URL: value }, "app")).toThrow(
        new DatabaseConfigError("DATABASE_URL must name a database, as in postgresql://user:password@host:5432/b4gone_dev."),
      );
    },
  );

  it("does not require TEST_DATABASE_URL", () => {
    expect(readDatabaseUrl({ DATABASE_URL: DEV_URL, TEST_DATABASE_URL: undefined }, "app")).toBe(DEV_URL);
  });
});

describe("readDatabaseUrl for the isolated test database", () => {
  it("returns TEST_DATABASE_URL rather than DATABASE_URL", () => {
    expect(readDatabaseUrl({ DATABASE_URL: DEV_URL, TEST_DATABASE_URL: TEST_URL }, "test")).toBe(TEST_URL);
  });

  it("does not require DATABASE_URL", () => {
    expect(readDatabaseUrl({ TEST_DATABASE_URL: TEST_URL }, "test")).toBe(TEST_URL);
  });

  it("names TEST_DATABASE_URL when it is missing", () => {
    expect(() => readDatabaseUrl({ DATABASE_URL: DEV_URL }, "test")).toThrow(
      new DatabaseConfigError("TEST_DATABASE_URL is not set. Copy .env.example to .env.local and set it."),
    );
  });

  it("applies the URL checks to TEST_DATABASE_URL", () => {
    expect(() => readDatabaseUrl({ TEST_DATABASE_URL: "https://localhost/b4gone_test" }, "test")).toThrow(
      new DatabaseConfigError("TEST_DATABASE_URL must start with postgres:// or postgresql://."),
    );
  });

  it.each(["b4gone_dev", "b4gone", "b4gone_test_copy", "b4gone-test"])(
    "refuses a database whose name does not end in _test (%s)",
    (name) => {
      const url = `postgresql://b4gone:s3cret-pw@localhost:5432/${name}`;
      expect(() => readDatabaseUrl({ TEST_DATABASE_URL: url }, "test")).toThrow(
        new DatabaseConfigError(
          "TEST_DATABASE_URL must name a database ending in _test so tests never touch development or production data.",
        ),
      );
    },
  );

  it("refuses the same database as DATABASE_URL, treating a missing port as 5432", () => {
    const env = {
      DATABASE_URL: "postgresql://owner:other-pw@localhost:5432/b4gone_test",
      TEST_DATABASE_URL: "postgresql://b4gone:s3cret-pw@localhost/b4gone_test",
    };
    expect(() => readDatabaseUrl(env, "test")).toThrow(
      new DatabaseConfigError("TEST_DATABASE_URL must point to a different database than DATABASE_URL."),
    );
  });

  it.each([
    ["another host", "postgresql://b4gone:s3cret-pw@db.example.com:5432/b4gone_test"],
    ["another port", "postgresql://b4gone:s3cret-pw@localhost:5433/b4gone_test"],
    ["an unparseable value", "not a url"],
  ])("allows a _test database when DATABASE_URL uses %s", (_case, appUrl) => {
    expect(readDatabaseUrl({ DATABASE_URL: appUrl, TEST_DATABASE_URL: TEST_URL }, "test")).toBe(TEST_URL);
  });
});

describe("readDatabaseUrl error messages", () => {
  it.each([
    [{ DATABASE_URL: "mysql://b4gone:s3cret-pw@localhost/b4gone_dev" }, "app"],
    [{ DATABASE_URL: "postgresql://b4gone:s3cret-pw@localhost:5432" }, "app"],
    [{ TEST_DATABASE_URL: "postgresql://b4gone:s3cret-pw@localhost:5432/b4gone_dev" }, "test"],
    [{ DATABASE_URL: TEST_URL, TEST_DATABASE_URL: TEST_URL }, "test"],
  ] as const)("never repeat the connection string or password (%j)", (env, target) => {
    const error = errorFrom(() => readDatabaseUrl(env, target));
    expect(error.name).toBe("DatabaseConfigError");
    expect(error.message).not.toContain("s3cret-pw");
    expect(error.message).not.toContain("b4gone:");
  });
});
