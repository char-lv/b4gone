# Setup and environments

This guide sets up B4Gone for local development and explains how local, test, CI, preview, and production settings stay separate. The current application does not read from the database yet; the steps below prepare the connection that authentication (#2) and the item API (#4) will use.

## Prerequisites

- Node.js 24.11.0 (see `.nvmrc`) and npm 11.x.
- A PostgreSQL 17 server with two databases: one for development (for example `b4gone_dev`) and one for integration tests whose name ends in `_test` (for example `b4gone_test`). A managed database or a local server both work; Docker and Homebrew are optional.
- On macOS 13, Google Chrome for end-to-end tests (see the README).

## 1. Install dependencies

```bash
npm ci
npx playwright install chromium
```

On macOS 13 the Chromium download fails; skip it and run end-to-end tests with `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`.

## 2. Create the development and test databases

Each partner uses their own development and test databases: a shared test database would let one partner's test run delete the other's data. Never point local work at the production database.

### Option A: Neon (managed, nothing to install)

1. Sign in at https://console.neon.tech and create a project named `b4gone` with PostgreSQL 17 in the region closest to you.
2. On the project's default branch, add two databases named `b4gone_dev` and `b4gone_test` (the console lists databases under the branch).
3. Use **Connect** on the project dashboard, select each database in turn, and copy its connection string. Keep the `sslmode=require` option at the end.

### Option B: Local PostgreSQL 17

With Homebrew:

```bash
brew install postgresql@17
brew services start postgresql@17
"$(brew --prefix postgresql@17)/bin/createdb" b4gone_dev
"$(brew --prefix postgresql@17)/bin/createdb" b4gone_test
```

The connection strings are `postgresql://<your-macOS-user>@localhost:5432/b4gone_dev` and `postgresql://<your-macOS-user>@localhost:5432/b4gone_test`. Postgres.app (PostgreSQL 17) works the same way.

With Docker, choose your own local password in place of `<local-password>`:

```bash
docker run --name b4gone-postgres -e POSTGRES_USER=b4gone -e POSTGRES_PASSWORD=<local-password> -p 5432:5432 -d postgres:17
docker exec b4gone-postgres createdb -U b4gone b4gone_dev
docker exec b4gone-postgres createdb -U b4gone b4gone_test
```

## 3. Configure `.env.local`

```bash
cp .env.example .env.local
```

Replace both placeholders in `.env.local`:

| Variable | Used by | Rule |
| --- | --- | --- |
| `DATABASE_URL` | The website (from #2 and #4 on) and `npm run db:check` | `postgres://` or `postgresql://` URL that names a database |
| `TEST_DATABASE_URL` | `npm run test:integration` and `npm run db:check -- --test` | Same format; the database name must end in `_test` and must differ from `DATABASE_URL` |

`.env.local` is ignored by git. Next.js loads it for `npm run dev` and `npm run build`; `npm run db:check` and `npm run test:integration` load it too. A variable already set in your shell takes priority over the file. Error messages name the variable but never print its value.

## 4. Verify the setup

```bash
npm run db:check
npm run db:check -- --test
npm run test:integration
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e   # macOS 13: PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e
```

A working connection prints a line such as `Connected to the app database "b4gone_dev" as "b4gone" (PostgreSQL 17.x).` The integration suite currently has three tests. It checks the connection, the PostgreSQL major version, and that the test role can create a table inside a transaction that is rolled back.

## Environments

| Environment | Runs | Database | Where the settings live |
| --- | --- | --- | --- |
| Local development | `npm run dev` on each partner's machine | That partner's development database (`DATABASE_URL`) | `.env.local`, ignored by git |
| Local tests | `npm run test:integration` | That partner's `_test` database (`TEST_DATABASE_URL`) | `.env.local` |
| CI | GitHub Actions on every pull request and push to `main` | A disposable `postgres:17` service container named `b4gone_test`, deleted after each job | `.github/workflows/ci.yml`; the throwaway CI password is not a secret |
| Preview | A deployment for each pull request once deploy previews are connected (#11) | A preview database or branch, never production | Hosting provider's encrypted environment variables, Preview scope |
| Production | Deployment from reviewed `main` (#11) | The production database | Hosting provider's encrypted environment variables, Production scope |

Rules that keep these separate:

- `.env.example` contains placeholders only. Real connection strings and secrets never appear in commits, fixtures, logs, screenshots, issues, PR descriptions, or chat.
- Preview and production settings are stored as managed secrets in the hosting provider, and GitHub Actions secrets hold anything CI needs. Each value is scoped to one environment.
- Integration tests connect only to `TEST_DATABASE_URL`. `src/lib/db/config.ts` refuses a test database whose name does not end in `_test` or that matches `DATABASE_URL`.
- Preview deployments must not use the production database.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `DATABASE_URL is not set` or `TEST_DATABASE_URL is not set` | Create `.env.local` from `.env.example` and set the variable. |
| `... must name a database ending in _test ...` | Point `TEST_DATABASE_URL` at a separate database such as `b4gone_test`. |
| `connect ECONNREFUSED` | The server is not running, or the host or port is wrong. |
| `password authentication failed` | The user name or password in the URL is wrong. Reset it in your provider or local server. |
| `database "b4gone_test" does not exist` | Create the database (step 2). |
| SSL or certificate errors with a managed database | Keep the provider's `sslmode=require` option in the URL. |
