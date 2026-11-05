# B4Gone

B4Gone is a website for tracking purchase return deadlines, warranty expirations, and subscription renewals.

## Planned MVP

- Account registration, sign-in, and private user records.
- Item creation, viewing, editing, deletion, and returned status.
- Subscription management with monthly/yearly billing and cancellation status.
- A dashboard showing upcoming deadlines and average monthly subscription cost.

Receipt uploads and AI receipt extraction are optional additions after the core features are complete. The MVP uses USD and dashboard reminders. Email/push notifications, multiple currencies, banking integrations, and shared records are outside the scope.

## Product requirements and prototype

The product requirements, user stories, acceptance criteria, and prototype URL are in [docs/PRD.md](docs/PRD.md).

## Project status

- [docs/P2_CHECKLIST.md](docs/P2_CHECKLIST.md) tracks every P2 requirement with its status, related issue or pull request, evidence, and remaining action.
- Sprint notes, standups, retrospectives, the contribution log, and the AI workflow record are in [docs/process/](docs/process/README.md).
- Work is planned on the [project board](https://github.com/users/char-lv/projects/1).

## Planned stack

Next.js, TypeScript, TailwindCSS, Next.js API routes, PostgreSQL, and JWT authentication.

## Current stage

The project scaffold, test tooling, and database configuration are in place (issue #1). Accounts work (issue #2): visitors can register, sign in, and sign out; the dashboard page is private and currently shows an empty state. Item and subscription features, the dashboard's deadlines, and receipt features are not implemented yet.

## Local setup

Requirements: Node.js 24.11.0 (see `.nvmrc`), npm 11.x, and access to a PostgreSQL 17 server with separate development and test databases. [docs/setup.md](docs/setup.md) explains how to create them and how local, test, CI, preview, and production settings stay separate.

```bash
npm ci
cp .env.example .env.local   # then set DATABASE_URL, TEST_DATABASE_URL, and SESSION_SECRET
npm run db:check             # connects to DATABASE_URL
npm run db:check -- --test   # connects to TEST_DATABASE_URL
npm run db:migrate           # creates the tables in DATABASE_URL
npx playwright install chromium
npm run dev
```

The site runs at http://localhost:3000. Registration and sign-in need the migrated `DATABASE_URL` database and `SESSION_SECRET`; the homepage loads without them.

## Commands

| Command | Purpose | Status |
| --- | --- | --- |
| `npm run dev` | Local development server | Works |
| `npm run lint` | ESLint CLI (flat config with eslint-config-next) | Works |
| `npm run typecheck` | `tsc --noEmit` in strict mode | Works |
| `npm run test:unit` | Vitest unit/component tests in run mode (jsdom, React Testing Library) | Works |
| `npm run test:coverage` | Vitest with V8 coverage and the declared thresholds | Works |
| `npm run test:e2e` | Playwright suite on Chromium; builds and starts the production server on port 3100 | Works (see note) |
| `npm run build` | Production build | Works |
| `npm run test:integration` | Vitest integration suite in Node against `TEST_DATABASE_URL` | Works; connection, migration, and auth API suites (migrations are applied first). Fails if `TEST_DATABASE_URL` is missing or unsafe |
| `npm run db:check` | Connects to `DATABASE_URL` (add `-- --test` for `TEST_DATABASE_URL`) and prints the database, user, and server version | Works |
| `npm run db:migrate` | Applies pending `db/migrations/*.sql` files to `DATABASE_URL` (add `-- --test` for `TEST_DATABASE_URL`) and records them in `schema_migrations` | Works |

Coverage thresholds: 80% lines, statements, and functions and 75% branches for `src/`, plus 90% lines and branches for `src/lib/**`. The root layout is excluded from unit coverage because it renders `<html>` and `<body>`; the Playwright smoke test covers it.

### Playwright on macOS 13

Playwright 1.64 cannot download its bundled Chromium on macOS 13. On those machines, use an installed Google Chrome:

```bash
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e
```

Without the variable, the suite uses Playwright's bundled Chromium (the default for CI and newer systems).

## Continuous integration

Every pull request and every push to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on Node.js from `.nvmrc`:

| Stage | Job | Checks |
| --- | --- | --- |
| 1 | Lint and type-check | `npm run lint`, `npm run typecheck` |
| 1 | Unit and component tests | `npm run test:coverage` with the declared thresholds; uploads the coverage report |
| 1 | Dependency audit | `npm audit --audit-level=high` |
| 1 | Dependency review (pull requests only) | Fails if the pull request adds a dependency with a high or critical advisory |
| 2 | Integration tests (PostgreSQL 17) | `npm run db:check -- --test` and `npm run test:integration` against a disposable `postgres:17` service container, after lint and type-check pass |
| 2 | Production build | `npm run build` after stage 1 quality and unit jobs pass |
| 3 | End-to-end tests | `npm run db:migrate`, then `npm run test:e2e` on Playwright's bundled Chromium against a disposable `postgres:17` service, after the build passes |

[`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) runs CodeQL security analysis (`security-extended` queries) on pull requests, on `main`, and weekly. Results appear under the repository's Security tab.

Third-party actions are pinned to full commit SHAs. The CI database uses throwaway credentials that exist only inside the job. Deploy previews and automated production deployment are still pending under issue #11.

## Deployment

The site is not deployed yet. [docs/deployment.md](docs/deployment.md) describes the planned Vercel setup (preview deployments for pull requests, production deployments from `main`), the steps for the first deployment, and the evidence to record. `npm run smoke -- <url>` checks a deployed site, and [`.github/workflows/deployment-smoke.yml`](.github/workflows/deployment-smoke.yml) runs that check after each successful deployment once Vercel is connected.
