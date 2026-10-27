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

## Planned stack

Next.js, TypeScript, TailwindCSS, Next.js API routes, PostgreSQL, and JWT authentication.

## Current stage

The project scaffold and test tooling are in place (issue #1). The homepage shows only a heading and a setup message. Authentication, item and subscription features, the dashboard, database access, and receipt features are not implemented yet.

## Local setup

Requirements: Node.js 24.11.0 (see `.nvmrc`) and npm 11.x.

```bash
npm ci
npx playwright install chromium
npm run dev
```

The site runs at http://localhost:3000.

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
| `npm run test:integration` | Database/API integration suite | Pending: exits with an error until the database work adds a real suite |

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
| 2 | Production build | `npm run build` after stage 1 quality and unit jobs pass |
| 3 | End-to-end tests | `npm run test:e2e` on Playwright's bundled Chromium after the build passes |

[`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) runs CodeQL security analysis (`security-extended` queries) on pull requests, on `main`, and weekly. Results appear under the repository's Security tab.

Third-party actions are pinned to full commit SHAs. Database integration tests, deploy previews, and automated production deployment are still pending under issue #11.
