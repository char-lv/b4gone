// Reads PostgreSQL connection strings (issue #1). Callers pass the environment, so this module has
// no side effects and tests never depend on the machine's variables. Error messages name the
// variable but never repeat its value, which usually contains a password.

export type DatabaseTarget = "app" | "test";

const VARIABLES: Record<DatabaseTarget, string> = {
  app: "DATABASE_URL",
  test: "TEST_DATABASE_URL",
};

const DEFAULT_PORT = "5432";

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

function databaseName(url: URL): string {
  return url.pathname.slice(1);
}

function parseConnectionUrl(variable: string, value: string): URL {
  if (!URL.canParse(value)) {
    throw new DatabaseConfigError(`${variable} is not a valid connection URL.`);
  }
  const url = new URL(value);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new DatabaseConfigError(`${variable} must start with postgres:// or postgresql://.`);
  }
  if (databaseName(url) === "") {
    throw new DatabaseConfigError(
      `${variable} must name a database, as in postgresql://user:password@host:5432/b4gone_dev.`,
    );
  }
  return url;
}

function isSameDatabase(a: URL, b: URL): boolean {
  return (
    a.hostname === b.hostname &&
    (a.port || DEFAULT_PORT) === (b.port || DEFAULT_PORT) &&
    databaseName(a) === databaseName(b)
  );
}

/**
 * Returns the connection string for the app database (DATABASE_URL) or the isolated test
 * database (TEST_DATABASE_URL). The test database must end in _test and differ from
 * DATABASE_URL so destructive test setup can never reach development or production data.
 */
export function readDatabaseUrl(env: Readonly<Record<string, string | undefined>>, target: DatabaseTarget): string {
  const variable = VARIABLES[target];
  const value = env[variable]?.trim();
  if (!value) {
    throw new DatabaseConfigError(`${variable} is not set. Copy .env.example to .env.local and set it.`);
  }
  const url = parseConnectionUrl(variable, value);

  if (target === "test") {
    if (!databaseName(url).endsWith("_test")) {
      throw new DatabaseConfigError(
        `${variable} must name a database ending in _test so tests never touch development or production data.`,
      );
    }
    const appValue = env[VARIABLES.app]?.trim();
    if (appValue && URL.canParse(appValue) && isSameDatabase(url, new URL(appValue))) {
      throw new DatabaseConfigError(`${variable} must point to a different database than ${VARIABLES.app}.`);
    }
  }
  return value;
}
