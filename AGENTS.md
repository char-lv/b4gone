# B4Gone project rules

## Start here

B4Gone is a website for purchase return deadlines, warranty expirations, and subscription renewals. Read the assigned issue and [docs/PRD.md](docs/PRD.md) before implementation. The PRD defines product behavior; the prototype guides presentation. These rules define how to build and verify it.

- Must have: private accounts, item CRUD and return/undo, subscription CRUD and cancel/reactivate, and a dashboard with upcoming deadlines and average monthly subscription cost.
- Receipt uploads and AI receipt extraction are could-have work only after the core features, tests, and deployment work. Manual entry must remain independent.
- Exclude email/push notifications, multiple currencies, banking, and shared household records. Use USD and dashboard reminders.
- Use English for repository content, interface text, code comments, and PRs. Keep changes within the assigned issue.
- Check [docs/P2_CHECKLIST.md](docs/P2_CHECKLIST.md) for project-wide P2 status. When a PR completes or changes tracked work, update that row's status, evidence, and remaining action in the same PR.

Prototype URL:

https://claude.ai/artifact/CPRyvxx7bDpjMWau2JmddM?sk=1KRqQph1BLUcx5C4NxUw-g

## Stack and dependency policy

The scaffold exists. The tested scaffold uses Node.js 24.11.0, npm 11.6.1, Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, and TailwindCSS 4.3.3. The add-item form was evaluated separately and has not yet been integrated into this branch; its extra validation dependency is not installed in this scaffold. The version lines below remain the stack policy; package.json and package-lock.json record the installed versions. pg 8.23.1 is installed for database access, which so far covers connection configuration only; authentication dependencies remain planned.

| Area | Baseline |
| --- | --- |
| Runtime | Node.js 24.x LTS; npm 11.x |
| Website and API | Next.js 16.x App Router, React 19.x, TypeScript 5.9.x with strict mode |
| Styling | TailwindCSS 4.x |
| Persistence | PostgreSQL 17.x; pg 8.x with parameterized SQL and versioned SQL migrations |
| Validation and auth | Zod 4.x, jose 6.x for JWTs, bcryptjs 3.x for password hashing |
| Unit/component tests | Vitest 4.x with a compatible Vite version; React Testing Library 16.x and jest-dom |
| End-to-end tests | Playwright 1.x; Chromium for the routine development suite |

At scaffolding, select compatible, security-patched releases within these lines, pin exact package versions, commit package-lock.json, and record the exact Node version in .nvmrc. Use npm consistently and npm ci after the lockfile exists. Match the deployed and CI runtimes. Update this table if a tested compatibility change is needed; do not silently switch stacks or upgrade major versions.

Prefer the listed libraries and existing components. Use plain React state and server refreshes before adding a state library. Avoid a separate Express service, an ORM, UI kits, or infrastructure that the current feature does not need. A managed PostgreSQL database is acceptable; local Docker or Homebrew is not a prerequisite.

## Architecture and conventions

Use one Next.js application. Keep route handlers thin: authenticate, validate, call domain/database functions, and return a consistent response. Server Components may call server services directly; Client Components never import database or signing code.

| Location | Responsibility |
| --- | --- |
| src/app/ | Pages, layouts, loading/error boundaries, and navigation |
| src/app/api/ | Authentication endpoints and protected item, subscription, and dashboard route handlers |
| src/features/items/, subscriptions/, dashboard/ | Feature components and domain behavior |
| src/components/ui/ | Small reusable controls such as buttons, fields, cards, and dialogs |
| src/lib/ | Shared date, money, and validation functions; isolate auth/db modules as server-only |
| db/migrations/ | Ordered SQL migrations; users, items, and subscriptions with owner foreign keys |
| tests/integration/, tests/e2e/ | Database/API checks and Playwright user flows |
| docs/ | PRD, OpenAPI specification, setup, architecture/schema diagrams, and sprint evidence |

- Name components and component files in PascalCase, functions and variables in camelCase, and other TypeScript files in kebab-case. Use singular domain types such as Item and Subscription.
- Use camelCase JSON fields, including purchaseDate, priceCents, returnDeadline, warrantyExpiration, and firstBillingDate. Use snake_case database columns and map them at the server boundary.
- Prefer explicit TypeScript types and small pure functions. Avoid any, suppressed type errors, duplicated business calculations, and speculative abstractions.
- Use async/await, handle expected failures, and keep internal errors out of responses. Return clear validation errors associated with fields and consistent 400/401/404 responses.
- Put shared form/server validation in one schema. Use server-side ownership checks for every operation, including list and detail queries.
- Successful mutations refresh affected lists, details, dashboard events, and cost totals. Await the save before confirming success; retain drafts on failure and prevent duplicate submissions.

## Product rules that must survive implementation

- Item names are required and 1-100 characters after trimming. Purchase dates are valid calendar dates on or before the user's local today. Optional return and warranty dates cannot precede purchase.
- Item price is optional: blank means null and zero means zero. Subscription amount is required. Reject malformed, negative, or more-than-two-decimal amounts; never silently round entered prices. Reject malformed separators such as 1,,2 rather than stripping commas before validation. Store integer cents and format USD only for display.
- Keep date-only values as YYYY-MM-DD/PostgreSQL DATE. Do not convert them through UTC timestamps for rendering. Pass an explicit user timezone to server-side date validation and derive today from the server clock in that timezone; inject today in pure functions and tests. Recompute the current local date at the validation/submission boundary or update it across local midnight; a value captured when the page opened can become stale. Test a page that remains open across midnight.
- Subscription names are 1-100 trimmed characters. Cycles are monthly or yearly, and the original firstBillingDate is the recurring anchor. The next charge is the first occurrence on or after today, including today.
- Preserve monthly anchor days: January 31 becomes February's last day, then March 31. A yearly February 29 becomes February 28 in non-leap years. Do not recur from a previously clamped date.
- Dashboard events cover today through day 30 inclusive; urgency covers days 0-7 inclusive. Exclude past events, returned items, and cancelled subscriptions. Include at most one next renewal per subscription; an item can have both a return and a warranty event.
- Sort events by date, event type, then record name. Counts describe deadlines, not items. Average monthly subscription cost is active monthly amounts plus active yearly amounts divided by 12, rounding only the final displayed total.
- Returning or cancelling keeps the record and removes its reminders; cancellation also removes its cost. Undo/reactivation recalculates eligibility from the original data. Deletion requires confirmation.

## UI and user flows

Use the prototype for Dashboard, Items, and Subscriptions. Follow the PRD when the prototype omits a state or interaction. If the prototype cannot be opened, report that limitation and use the written design guidance; do not claim a visual comparison.

- Dashboard: off-white background, white cards, charcoal text, restrained deep-green accents, generous space, subtle borders, and light shadows. Show two summary cards only: upcoming deadline count and Average monthly subscription cost. Put add actions at the top and one clean event list below; optional 0-7/8-30 day groups must not duplicate events.
- Items: list with active/returned status, Add item, and access to details. The add/edit form field order is Name, Purchase date, Price (USD), Return deadline, Warranty expiration. Details expose edit, delete, return, and undo actions.
- Subscriptions: list/details and add/edit forms show service name, amount, billing cycle, first billing date, next charge, and status; expose cancel/reactivate and confirmed delete.
- Flow: sign in, open Items or Subscriptions, add a record, fix field errors, save, and see affected views update. Opening a dashboard event takes the user to its record.
- Include loading, empty, and actionable error states. Use visible labels, required-field indicators, semantic buttons, keyboard access, focus states, and accessible confirmation dialogs. After a dialog closes, restore focus to its trigger.
- Urgency needs text such as Due today or In 3 days; color alone is insufficient. Check mobile and desktop layouts for clipped controls, overflow, and readable contrast.
- Remove the visible Demo today line. Keep any prototype-only controls collapsed and out of the production workflow. Use real empty states rather than invented saved user data.

## Testing and commands

Use red-green-refactor for application behavior: write a meaningful failing test, run it, commit the failure with the issue reference, implement the smallest change, then refactor with tests passing. Preserve this sequence in git history; do not squash away required TDD evidence. Keep the actual failing-test output with its commit SHA. Disclose split or reordered local commits; commit order alone does not establish when tests were run.

- Unit tests cover date, recurrence, money, validation, reminder selection, and cost calculations. Component tests use accessible roles/labels and user actions rather than implementation internals or large snapshots.
- Integration tests use an isolated PostgreSQL test database for auth, persistence, validation, and two-user ownership checks. Never run destructive setup against production or development records. Integration tests connect only through TEST_DATABASE_URL; src/lib/db/config.ts requires its database name to end in _test and to differ from DATABASE_URL.
- Playwright covers sign-in, item add/edit/return/undo/delete, subscription cancel/reactivate, and updates across lists/details/dashboard/totals. Include a failed-save path and keyboard use. Async Server Components are verified through integration/E2E where needed.
- Project coverage goals: at least 80% lines/statements/functions and 75% branches for authored application code; at least 90% lines and branches for shared date/money/recurrence/validation modules. Exclude generated files and configuration, not difficult business cases. These are team targets, not percentages specified by the instructor.
- Required cases include blank versus zero money, excess decimals, trimmed-name boundaries, invalid/future purchase dates, leap years, short months, dates on days 0/7/30, and foreign-owner record IDs. Fix the clock and timezone in tests.

The scripts below are available. npm run test:integration covers the test-database connection, SQL migrations, and the auth API with two-user session checks; item and subscription ownership suites are added with #4 and #7. Database commands read .env.local; docs/setup.md explains the development and test databases. On the current macOS 13 machine, use PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e. Bundled Chromium remains unverified on this machine.

| Command | Purpose |
| --- | --- |
| npm run dev | Local website |
| npm run lint | ESLint CLI; do not use removed next lint |
| npm run typecheck | TypeScript without emitting files |
| npm run test:unit | Vitest unit/component tests in run mode |
| npm run test:integration | Isolated database/API suite |
| npm run test:coverage | Vitest with the declared thresholds |
| npm run test:e2e | Playwright end-to-end suite |
| npm run build | Production build |
| npm run db:check | Connection check for DATABASE_URL; add -- --test for TEST_DATABASE_URL |
| npm run db:migrate | Apply pending db/migrations/*.sql to DATABASE_URL; add -- --test for TEST_DATABASE_URL |

Run checks appropriate to the change. Report actual commands, results, and environment blockers. Do not weaken assertions, thresholds, auth, or CI to make a check pass.

## GitHub, sprints, and pair workflow

- Board: https://github.com/users/char-lv/projects/1 . Keep Backlog, Sprint Todo, In Progress, In Review, Done in that order. Move an issue only when its real state changes.
- Milestones: Sprint 1 and Sprint 2, with at least five issues each. Their current due dates are internal planning targets; Canvas defines the official homework/project deadlines. Keep estimates and acceptance checklists in issue bodies.
- Each sprint has a Product Owner and a Scrum Master. The partners swap roles every sprint; the sprint notes in docs/process/ record who holds each role.
- Work on one branch per issue: feature/4-item-api, fix/10-dashboard-refresh, chore/1-project-rules, or docs/12-api-guide. Start from current main and preserve unrelated work.
- Commit format: type(scope): short action (#issue). Types are feat, fix, test, refactor, docs, and chore. Example: test(items): reject invalid return dates (#4). Reference the issue in commits and PRs; add code comments with issue links only when they explain a lasting decision.
- Open a focused PR explaining behavior, validation, and remaining limits. Use Refs #N for partial work and Closes #N only when all issue criteria are met. Move to In Review when ready and Done after review, passing required checks, and merge.
- The other partner reviews before merge; do not self-approve or fabricate review activity. Preserve real commits from both partners and at least five genuine PR reviews per partner over P2. Both partners maintain these rules; ownership may change with availability.
- Plan each sprint jointly, record at least three standup updates per partner per sprint in the course Slack channel, and write a retrospective with partner feedback. Record actual completed work, next steps, blockers, and links; keep an honest contribution log.
- PR CI lives in .github/workflows/ and the README summarizes it: lint/types, unit tests with coverage, integration tests on a disposable PostgreSQL 17 service, build, E2E, dependency audit/review, and CodeQL. Merge only when required checks pass; do not skip or weaken a check to make it pass. Provide PR deployment previews and reviewed-main production deployment with separate local/test/preview/production settings (docs/setup.md, docs/deployment.md). Keep OpenAPI and setup documentation aligned with implemented endpoints.

## Security and changes to avoid

- Hash passwords with bcryptjs, enforce its input limits without silent truncation, and verify JWT signatures and expiry with jose. Keep sessions in HttpOnly cookies with SameSite and production Secure settings; do not store bearer tokens in localStorage.
- Derive owner IDs from verified sessions. Use parameterized queries and owner predicates in every record read/write; do not rely on client filters or route-level page protection alone.
- Validate request bodies and protect cookie-authenticated mutations against CSRF with origin checks and appropriate cookie/request policies. Treat receipt/OCR text as untrusted input if optional features are later added.
- Keep database credentials, JWT secrets, tokens, and real personal records out of commits, fixtures, logs, screenshots, and PR descriptions. Commit .env.example placeholders only. Keep dependency/security findings visible and address applicable findings before release.
- Do not introduce email/push, banking, sharing, currency conversion, or AI services while implementing core issues. Do not rewrite working modules, drop user data, disable protections, or add packages without a concrete need explained in the PR.

## Repository content

Keep project source, tests, configuration, README, PRD, and shared development rules in this repository. Individual homework reflections, submission packages, raw conversations, and experimental archives stay outside the shared repository unless an assignment explicitly requires repository storage. HW3 comparison evidence and the personal reflection can be submitted through Canvas.

## Loading shared instructions

Keep AGENTS.md as the shared source. A root CLAUDE.md may contain only an import of this file so Claude Code versions with different loading behavior use the same rules. Verify loaded context with /context or /memory when checking shared instructions. Never remove a teammate's global settings to prepare the experiment.
