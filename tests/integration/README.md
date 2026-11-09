# Integration tests

`npm run test:integration` runs the files in this folder with Vitest in Node (`vitest.integration.config.mts`). It connects only to `TEST_DATABASE_URL`, whose database name must end in `_test` and differ from `DATABASE_URL`; see [docs/setup.md](../../docs/setup.md).

Before any suite runs, `global-setup.ts` applies `db/migrations/` to the test database. `setup.ts` points the app's `@/lib/db/pool` at `TEST_DATABASE_URL`, so route handlers can be called directly without touching `DATABASE_URL`.

Current suites:

- `database-connection.test.ts` checks the connection, the PostgreSQL 17 server version, and that the test role can create a table and run parameterized queries inside a transaction that is rolled back.
- `migrations.test.ts` checks migration order, idempotence, rollback of a failing file, and the `users` table constraints. Its scratch cases use a separate schema and history table.
- `auth-api.test.ts` covers registration, sign-in, sign-out, and session lookup, including field errors, duplicate emails, cross-origin requests, tampered or orphaned sessions, two-user isolation, and that passwords and tokens never reach the logs (#2). It deletes only the `@auth-test.example` accounts it creates.

- `item-repository.test.ts` and `items-api.test.ts` cover item persistence and the item API: null versus zero prices, date-only values that do not shift with the session time zone, list order, validation against today in the sent time zone, and two-user ownership (#4). They delete only the `@items-test.example` and `@items-api-test.example` accounts they create; items go with them.
- `migrations.test.ts` also checks the `items` table constraints (#4), inside transactions that are rolled back.

Subscription API suites (#7) are not written yet. Each suite must create and clean up its own data in the test database and never connect to `DATABASE_URL`.
