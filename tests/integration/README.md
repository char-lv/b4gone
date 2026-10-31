# Integration tests

`npm run test:integration` runs the files in this folder with Vitest in Node (`vitest.integration.config.mts`). It connects only to `TEST_DATABASE_URL`, whose database name must end in `_test` and differ from `DATABASE_URL`; see [docs/setup.md](../../docs/setup.md).

Current suite:

- `database-connection.test.ts` checks the connection, the PostgreSQL 17 server version, and that the test role can create a table and run parameterized queries inside a transaction that is rolled back.

Authentication, item, and subscription API suites (issues #2, #4, #6, and #7) are not written yet. Each suite must create and clean up its own data in the test database and never connect to `DATABASE_URL`.
