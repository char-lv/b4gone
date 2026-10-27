export type DatabaseTarget = "app" | "test";

export class DatabaseConfigError extends Error {}

export function readDatabaseUrl(env: Readonly<Record<string, string | undefined>>, target: DatabaseTarget): string {
  throw new Error(`Not implemented: readDatabaseUrl(${Object.keys(env).length} variables, ${target})`);
}
