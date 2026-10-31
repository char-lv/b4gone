// Applies the ordered SQL files in db/migrations (issue #2). Shared by `npm run db:migrate` and the
// integration test setup. Node strips the TypeScript types, so keep imports relative with extensions.

export type MigrationClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type MigrationOptions = {
  /** History table that records applied versions. Tests pass their own to stay isolated. */
  table?: string;
};

/** Returns the migration file names in the order they must run. */
export function selectMigrationFiles(fileNames: readonly string[]): string[] {
  void fileNames;
  throw new Error("Not implemented: selectMigrationFiles");
}

/** Applies every migration that is not yet recorded and returns the versions it applied. */
export async function applyMigrations(
  client: MigrationClient,
  directory: string,
  options: MigrationOptions = {},
): Promise<string[]> {
  void client;
  void directory;
  void options;
  throw new Error("Not implemented: applyMigrations");
}
