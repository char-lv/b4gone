# P2 completion tracker

This tracker follows John Guerra's CS 6983 handout [Building P2 from Zero — Checklist](https://github.com/john-guerra/ai-coding-class/blob/main/course/handouts/p2-from-zero-checklist.md) (version `86523f4`) and the additional requirements and rubric in the [P2 specification](https://github.com/john-guerra/ai-coding-class/blob/main/course/projects/project2-full-stack.md) (version `76f0787`). The item wording is condensed from those documents.

**Last checked: 2026-11-04** by Chengling against the repository, the GitHub API (issues, board, pull requests, reviews, Actions runs, deployments, and repository settings), anonymous requests to the Vercel URLs, and local command runs. Vercel facts come from the Vercel CLI (64.7.0) signed in as the project owner on 2026-11-04. Update a row in the same pull request that changes its status, and mark something Done only after checking the actual files, results, or links.

Statuses:

| Status | Meaning |
| --- | --- |
| Done | Merged to `main`, or recorded on GitHub, and verified |
| Awaiting merge | Implemented and verified in an open pull request that still needs partner review |
| Partial | Some of the item is done; the remaining action says what is left |
| Pending verification | Reported done, but the evidence is not yet linked or checked |
| Not started | No work yet |
| Optional | Not required for P2 |

The team uses VS Code with Claude Code. The professor confirmed that any IDE is acceptable, so older wording about Antigravity or "Agent mode" refers to this setup. Process records (sprint notes, standups, retrospectives, contributions, AI use) live in [docs/process/](process/README.md). That is the equivalent of the handout's `docs/sprints/` path.

## Steps 0–1: Idea, research, PRD

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Brainstorm 2–3 ideas and pick one a real user wants | Pending verification | — | Jiaying wrote the formal project proposal; its location is not linked yet | Jiaying links the proposal or names its Canvas submission in [contribution-log.md](process/contribution-log.md) |
| *Optional:* 3+ Mom Test conversations in `docs/research/` | Optional | — | No `docs/research/` folder | None required |
| `docs/PRD.md` with problem, personas, user stories, non-goals | Done | — | [PRD](PRD.md): overview and target users (Section 1), scope and exclusions (Section 2), US-01–US-07 (Section 4) | Target users are one paragraph, not named personas. A short personas subsection is optional |
| Every user story has testable acceptance criteria | Done | — | [PRD Section 4](PRD.md#4-user-stories-and-acceptance-criteria) checklists; each issue body repeats its criteria | None |
| Stack from the P2 list | Done | — | Next.js + TailwindCSS, Next.js API routes, PostgreSQL, JWT ([AGENTS.md](../AGENTS.md#stack-and-dependency-policy)) | JWT auth is implemented in #2 |

## Step 2: DESIGN.md

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Mockup in `docs/design/` | Partial | No issue yet | The approved prototype is a Claude artifact linked in [PRD Section 7](PRD.md#7-ui-design-reference) and AGENTS.md; it opened on 2026-10-28. No `docs/design/` folder | Add `docs/design/` with screenshots of Dashboard, Items, and Subscriptions plus the link |
| Root `DESIGN.md` with tokens (colors, type, spacing) and sections from Overview to Do's and Don'ts | Not started | No issue yet | — | Write it from the prototype: off-white `#F7F7F5` background, white surfaces, charcoal `#24292B` text, deep green `#1F5D4C` accent, red `#B42318` reserved for urgency, Public Sans, 10px/6px radii, light shadows, and its button, card, field, tag, dialog, focus, and urgency-label rules |
| `npx @google/design.md lint DESIGN.md` passes | Not started | No issue yet | — | Run after writing DESIGN.md. Pin the tool version if it is added to `package.json` or CI |
| Tailwind theme generated with `npx @google/design.md export --format css-tailwind DESIGN.md` | Not started | No issue yet | `src/app/globals.css` has no design tokens yet | Generate the theme instead of copying values; regenerate after DESIGN.md changes |
| AGENTS.md says "UI work follows `DESIGN.md`" | Not started | No issue yet | AGENTS.md currently points UI work to the prototype and PRD | Add the line in the same pull request as DESIGN.md |

No existing issue covers DESIGN.md. Decide at the next standup whether to open a Sprint 1 chore issue for it, or add it to #3 before the first UI pull request. #2 and #3 both build UI and need the tokens.

## Step 3: Rules and memory files

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| One root `AGENTS.md`, not copied into tool folders | Done | #1, [#13](https://github.com/char-lv/b4gone/pull/13) | [AGENTS.md](../AGENTS.md); `git ls-tree` on `main` shows no `.agents/`, `.cursor/`, or `.claude/` folder | None |
| Covers stack and versions, exact commands, conventions, testing rule, security don'ts, where docs live | Done | #1 | AGENTS.md sections: Stack and dependency policy, Architecture and conventions, Testing and commands, Security and changes to avoid, Repository content | Keep it in sync with each merged change (for example, the database commands in [#16](https://github.com/char-lv/b4gone/pull/16)) |
| Records the workflow: PO and SM rotate each sprint, one branch per issue, partner review before merge | Partial | #12, [#17](https://github.com/char-lv/b4gone/pull/17) | Branch-per-issue, partner review, and the rotation rule are in AGENTS.md (#17 merged 2026-10-31). Who holds each role is not recorded | Both partners choose the Sprint 1 Product Owner and Scrum Master and record them in [sprint-1.md](process/sprint-1.md) |
| Under ~200 lines and links to `docs/` | Done | #1 | 129 lines on `main` (130 with #16). The lines are long paragraphs (about 15.6 KB) | Link to docs instead of adding detail |
| Tool folders hold only path-scoped rules or skills | Done | — | No tool folders in the repository | None |
| Changed through PRs and revisited at every retro | Partial | #1, #3, #12 | AGENTS.md changes merged through [#13](https://github.com/char-lv/b4gone/pull/13), [#14](https://github.com/char-lv/b4gone/pull/14), [#16](https://github.com/char-lv/b4gone/pull/16), and [#17](https://github.com/char-lv/b4gone/pull/17), each approved by Jiaying. No retrospective has been held | Review AGENTS.md and the proposals in [ai-workflow.md](process/ai-workflow.md#proposed-rule-changes-for-joint-review) at each retro |
| `CLAUDE.md` contains `@AGENTS.md` | Done | #1, [#13](https://github.com/char-lv/b4gone/pull/13) | Root `CLAUDE.md` is the single line `@AGENTS.md`. On 2026-10-28 Chengling's Claude Code session showed the AGENTS.md rules loaded through it | Jiaying confirms with `/memory` in her setup |

## Step 4: Backlog and board

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| User stories turned into issues using an issue template (story, acceptance criteria, estimate) | Done | #12, [#19](https://github.com/char-lv/b4gone/pull/19) | Issues #1–#12 have goal, acceptance criteria, estimate, and priority in their bodies. #19 (merged 2026-10-31) adds a user story or task template and a bug template | Use the template for new issues |
| One milestone per sprint; labels `feature`, `bug`, `chore` | Done | — | [Sprint 1](https://github.com/char-lv/b4gone/milestone/1) (#1–#6, due 2026-10-30) and [Sprint 2](https://github.com/char-lv/b4gone/milestone/2) (#7–#12, due 2026-11-12), six issues each; all three labels exist | None |
| Board columns Todo · In Progress · In Review · Done | Done | — | [Board](https://github.com/users/char-lv/projects/1): Backlog, Sprint Todo, In Progress, In Review, Done. On 2026-11-04: #1 Done; #2 In Review; #3, #11, #12 In Progress; #4–#6 Sprint Todo; #7–#10 Backlog | Move a card only when its real state changes |
| Sprint planning doc: goal, issues, estimates, PO and SM | Partial | #12, [#17](https://github.com/char-lv/b4gone/pull/17) | [sprint-1.md](process/sprint-1.md) and [sprint-2.md](process/sprint-2.md) have scope, issues, points (26 and 24), and owners. #2 (Jiaying) and #3–#5 (Chengling) are confirmed and assigned | Record the joint planning date and link, and the PO and SM; confirm owners for #1 and #6–#12 |
| PR template with `Closes #N`, how it was tested, and a partner-review checkbox | Done | #12, [#19](https://github.com/char-lv/b4gone/pull/19) | `.github/pull_request_template.md` (merged 2026-10-31) has `Closes`/`Refs`, test-first evidence, a commands table, and a partner-review checklist; [#20](https://github.com/char-lv/b4gone/pull/20) uses it | None |
| Each issue: branch → implement with the agent → AI self-review → PR → partner review → merge → Done | Partial | — | Followed for [#13](https://github.com/char-lv/b4gone/pull/13)–[#19](https://github.com/char-lv/b4gone/pull/19): Jiaying approved each one before it merged (Jiaying merged #15–#19 on 2026-10-31). Jiaying's [#20](https://github.com/char-lv/b4gone/pull/20) (#2) is open and waiting for Chengling's review | Continue for every issue |

## Step 5: CI

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` runs on every PR | Done | #11, [#15](https://github.com/char-lv/b4gone/pull/15) | Merged 2026-10-31. Every job passed on `main` at `7aa3a2b` ([run](https://github.com/char-lv/b4gone/actions/runs/41168038127)) and on #20 at `5b6cf81` ([run](https://github.com/char-lv/b4gone/actions/runs/41179448154)) | None |
| Stages: lint + format → unit + integration → build → E2E | Partial | #11, [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16) | Merged. Stage 1: lint, type-check, unit tests with coverage, audit. Stage 2: integration on PostgreSQL 17, build. Stage 3: Playwright E2E | No formatter or format check exists. Add one (for example Prettier, with the package justified in the PR) under #11 |
| Security-scan job (`npm audit`, CodeQL) | Done | #11, [#15](https://github.com/char-lv/b4gone/pull/15) | `npm audit --audit-level=high`, dependency review (pull requests only), and CodeQL `security-extended` run on `main` and pull requests; CodeQL also runs on a schedule ([run](https://github.com/char-lv/b4gone/actions/runs/41446339975)). Secret scanning, push protection, and Dependabot security updates were still off on 2026-11-04 (repository API) | The owner decides on the other security settings |
| PRs merge only when CI is green (branch protection) | Not started | #11 | `main` still had no branch protection and no rulesets on 2026-11-04 (API returns `Branch not protected`) | The owner requires the CI checks and one approving review on `main` |
| Pre-commit hook runs lint and format (Husky + lint-staged) | Not started | #11 | — | Add after the formatter, explaining the new packages in the PR |
| CI never uses production secrets; tests hit a local or test database | Done | #1, #11, [#16](https://github.com/char-lv/b4gone/pull/16) | CI integration tests use a disposable `postgres:17` service with throwaway credentials. The repository had no Actions secrets or variables on 2026-11-04 | Keep production values in the host only |

## Step 6: First feature, test-first

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Thin vertical slice: one page → one API route → one table | Not started | #2, #3, #4 | — | First slice: sign-in (#2, users table) or Items (#3 form, #4 API and items table) |
| Failing test committed first (red), then code (green), then refactor | Partial | #1 | #1 homepage: red [`960aa11`](https://github.com/char-lv/b4gone/commit/960aa11) → green [`54b2916`](https://github.com/char-lv/b4gone/commit/54b2916) on `main`. The original failing output was not kept; on 2026-10-27 a re-run failed at `960aa11` and passed at `54b2916`. #1 database configuration in [#16](https://github.com/char-lv/b4gone/pull/16): red `24e2633` and `ec5761d`, green `1f6b8eb`, with failing output | Every feature issue keeps its red command, output, and SHA. Run B code reused in #3 is labeled as existing code; its midnight-date fix gets new red/green commits |
| Schema in a migration file | Not started | #2, #4 | `db/migrations/` is planned in AGENTS.md | Add versioned SQL migrations with the first tables (users in #2, items in #4) |
| Seed script for partner and CI data | Not started | #4 | — | Add a seed with invented sample data only, never real records |
| Error paths: empty input, bad input, database down | Partial | #1, #4, #6 | `npm run db:check` exits 1 with a clear message for a missing variable, wrong scheme, refused connection, or unsafe test database (#16, run locally) | Feature tests for empty or bad input and an unreachable database (#4, #6) |
| Endpoint documented in `docs/api/openapi.yaml` | Not started | #12 with #2, #4, #7 | — | Document each endpoint in the pull request that adds it |
| Page checked against the mockup in a browser; schema read through a database MCP server | Not started | #3, #4 | The prototype is available for comparison | Compare in the browser during #3. A database MCP server is optional tooling; record it in [ai-workflow.md](process/ai-workflow.md) if used |

## Step 7: Deploy

| Item | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Production deploys from `main`; every PR gets a preview | Partial | #11, [#18](https://github.com/char-lv/b4gone/pull/18) | Jiaying merged #19 at 04:18:39 UTC on 2026-10-31; Vercel reported a completed deployment of `7aa3a2b` at 04:21 ([deployment](https://vercel.com/cj-09b7/b4gone/6ANgb6a3fiKmVVDJeNiLbfvs9b5K)). On 2026-11-04 the Vercel project API confirmed it as the production target, with alias https://b4gone.vercel.app, which passed `npm run smoke`. Previews built for #18 and #20 | Deploy accounts after #20 is fixed, reviewed, and merged, then verify sign-in on production |
| Env vars set per environment in the host; `.env.example` lists names only | Partial | #1, #11, [#16](https://github.com/char-lv/b4gone/pull/16) | #16 adds `.env.example` with placeholder values (no real values). No Vercel environment variables are set; the scaffold needs none | Add `DATABASE_URL` and the session secret per scope when #2/#4 first read them |
| Running migrations against production is a written-down step | Not started | #4, #11 | No migrations yet | Document the command and order in `docs/deployment.md` with the first migration |
| Previews use a test database (or the team knows they share production data) | Partial | #11, #2 | The environment matrix in `docs/setup.md` requires a separate preview database. In [#20](https://github.com/char-lv/b4gone/pull/20) Jiaying reports creating a Neon project with `production` and `preview` branches and migrating both. Not yet verified: the migration output and the Vercel variables are not linked | Jiaying links the migration evidence; the owner confirms separate `DATABASE_URL` and `SESSION_SECRET` values for Preview and Production |
| One health-check URL proves the app and the database are up | Not started | #11 | `npm run smoke` (#15) checks only the homepage | Add a tested health route that queries the database (after #16 merges), then point the smoke check at it |
| README has the live URL, local run steps, and deploy steps | Partial | #12, [#15](https://github.com/char-lv/b4gone/pull/15) | Local setup is in the README, deploy steps in `docs/deployment.md`, and the production URL is added to the README in this update | Update the URL notes when accounts and features are deployed |

Preview access: Vercel Authentication protects previews. On 2026-11-04 the #20 preview still redirected anonymous requests to the Vercel sign-in, and the repository had no `VERCEL_AUTOMATION_BYPASS_SECRET`. A Hobby project cannot add Jiaying as a member, so the owner chooses between a bypass secret for automation or turning off preview protection (previews must never hold real data). No choice is recorded in #11 yet.

## What P2 also requires

### Features (45 points)

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Authentication (JWT or OAuth) | Not started | #2 (Jiaying) | — | bcryptjs hashing, jose JWT in HttpOnly cookies, CSRF origin checks, two-user isolation tests |
| 3+ distinct features | Not started | #3–#5, #7–#9 | — | Items, Subscriptions, and Dashboard |
| Real-time updates or complex state management | Not started | #5, #7, #9, #10 | — | B4Gone's candidate is complex state: derived reminders, return/undo, cancel/reactivate, and synchronized lists, details, dashboard, and totals. Confirm the choice and describe it in the README |
| Public API with documentation | Not started | #4, #7, #12 | — | Item, subscription, and dashboard routes plus OpenAPI |
| Professional UI/UX | Not started | #9, #10, DESIGN.md | Prototype approved | DESIGN.md tokens, responsive and accessible pages |

### Testing and code quality (60 points)

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Unit + integration + E2E tests | Partial | #1, [#16](https://github.com/char-lv/b4gone/pull/16), #6, #10 | `main`: 1 unit test and 1 Playwright smoke test. #16: 28 database-configuration unit tests and a 3-test integration suite. On 2026-10-28 the suite passed locally against Docker PostgreSQL 17.11 ([record](https://github.com/char-lv/b4gone/pull/16#issuecomment-6481501119)) and in CI ([job](https://github.com/char-lv/b4gone/actions/runs/40774859718/job/123121596715)) | Feature, ownership, and flow tests in #2–#10 |
| Failing tests committed first | Partial | all feature issues | See Step 6 | Keep red output and SHAs in each PR |
| Coverage goals (team targets in AGENTS.md) | Done for current code | #1 | `npm run test:coverage` on `main` and #16 meets the thresholds (100% statements, lines, and functions on `main`; 96.15% branches on #16) | Keep the thresholds as features grow |
| Database design | Not started | #2, #4, #7 | — | Migrations with owner foreign keys, then the schema diagram |
| Security practices | Partial | #2, #11 | Secrets kept out of the repository; `src/lib/db/config.ts` never prints connection strings (#16); CodeQL and audits (#15) | Auth, ownership predicates, and CSRF protection in #2/#4 |

### CI/CD and DevOps (30 points)

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Multi-stage pipeline | Done | #11, [#15](https://github.com/char-lv/b4gone/pull/15) | See Step 5 | Add the format stage |
| Deploy previews | Partial | #11 | Previews of #18 and #20 built successfully and are protected by Vercel Authentication | Decide preview access; verify sign-in on a preview once its variables are set |
| Tests run in CI | Done | #11, [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16) | Unit, integration, build, and E2E jobs pass on `main` and pull requests | None |
| Security scanning | Done | #11, [#15](https://github.com/char-lv/b4gone/pull/15) | See Step 5 | Decide on secret scanning and Dependabot |
| Automated deployment | Partial | #11, [#18](https://github.com/char-lv/b4gone/pull/18), [#23](https://github.com/char-lv/b4gone/pull/23) | A reviewed merge to `main` (#19) produced a production deployment through the Vercel Git integration without manual steps. `deployment-smoke.yml` has never run: the Vercel project has GitHub deployments disabled and repository dispatch events disabled (project API, 2026-11-04) | Review and merge #23, then the owner enables repository dispatch events in Vercel; link the first real run |
| Environment management | Partial | #1, #11, [#22](https://github.com/char-lv/b4gone/pull/22) | Local, test, CI, preview, and production settings are separated in `docs/setup.md` (#16). Local development and test databases verified on 2026-10-28. Vercel builds used Node v24.22.2 / npm 11.19.1 (build logs of `7aa3a2b` and #20's `5b6cf81`); local and CI use 24.11.0 / npm 11.6.1 | Host-scoped variables for #2 (see the Previews row). Draft [#22](https://github.com/char-lv/b4gone/pull/22) proposes 24.22.2; joint agreement and both partners' local upgrades are pending. Until then, regenerate the lockfile with `npx npm@11.19.1` whenever dependencies change |

### Agile process and pair workflow (20 points)

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| 2+ sprints, each a milestone with 5+ issues | Done | — | Two milestones with six issues each | None |
| Joint sprint planning | Partial | #12 | Ownership of #2 (Jiaying) and #3–#5 (Chengling) was agreed jointly. No dated planning record | Link the planning meeting or Slack thread in each sprint note |
| Retrospective per sprint with partner feedback | Not started | #12 | Templates in the sprint notes | Hold after each sprint; each partner writes their own feedback |
| 3+ standups per partner per sprint | Not started | #12 | 0 of 6 recorded per sprint. Drafted messages do not count | Post in the course Slack channel, then link each one in the sprint notes |
| 5+ PR reviews per partner | Partial | — | Jiaying: 7 approvals, #13–#19 ([#15](https://github.com/char-lv/b4gone/pull/15#pullrequestreview-5721043876), [#16](https://github.com/char-lv/b4gone/pull/16#pullrequestreview-5721170397), [#17](https://github.com/char-lv/b4gone/pull/17#pullrequestreview-5721186599), [#18](https://github.com/char-lv/b4gone/pull/18#pullrequestreview-5721019519), [#19](https://github.com/char-lv/b4gone/pull/19#pullrequestreview-5721189402); #13 and #14 in [contribution-log.md](process/contribution-log.md)). Chengling: 0; Jiaying's first pull request, [#20](https://github.com/char-lv/b4gone/pull/20), has no review yet | Chengling reviews #20 and Jiaying's later pull requests |
| Task estimation | Done | — | Story points in each issue | Use actual velocity at Sprint 2 planning |
| Contribution balance: substantial commits from both | Partial | — | Every commit on every branch is Chengling's (author names `char-lv` and `Chengling Lv`, same email); Jiaying has none yet | Jiaying's #2 work and her other confirmed issues |
| Shared rules maintained by both partners | Partial | — | Jiaying reviewed and approved the rules in [#13](https://github.com/char-lv/b4gone/pull/13). Every AGENTS.md commit is by Chengling | Jiaying authors at least one AGENTS.md change (for example, an agreed proposal from [ai-workflow.md](process/ai-workflow.md)) |
| Shared repository with push access for both | Done | — | Collaborator API: `Jasmine-G-uo` has `write` (2026-10-28) | None |
| User stories with acceptance criteria | Done | — | PRD Section 4 and the issue bodies | None |

### AI mastery (30 points)

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Shared rules file and context engineering | Partial | #1, #3, #12 | AGENTS.md, the CLAUDE.md import, HW3-driven refinement ([`c96d056`](https://github.com/char-lv/b4gone/commit/c96d056)), and [ai-workflow.md](process/ai-workflow.md) | Both partners record their AI sessions |
| AI-assisted TDD | Partial | all feature issues | [TDD record](process/ai-workflow.md#ai-assisted-tdd-record) | Add each feature's red/green record |

### Documentation (15 points) and deliverables

| Requirement | Status | Issue / PR | Evidence | Remaining action |
| --- | --- | --- | --- | --- |
| Comprehensive README | Partial | #12 | Overview, setup, commands, and links to the PRD and this tracker | Production URL, board link, final feature status |
| API documentation (OpenAPI/Swagger) | Not started | #12 | — | `docs/api/openapi.yaml` for implemented endpoints, with authentication, examples, validation, and errors |
| Architecture diagram | Not started | #12 | — | Draw it from the implemented structure |
| Database schema diagram | Not started | #12 | — | Draw it from the migrations |
| Setup/deployment guide | Partial | #1, #11, [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16) | `docs/setup.md` (Docker option verified locally on 2026-10-28) and `docs/deployment.md`, both merged | Migration and production database steps (proposed in #20) |
| Sprint retrospectives | Not started | #12 | — | See Agile process |
| Partner contribution log | Partial | #12, [#17](https://github.com/char-lv/b4gone/pull/17) | [contribution-log.md](process/contribution-log.md), merged | Each partner adds their own entries |
| 10-minute demo video | Not started | #12 | — | Record after the core features are deployed |
| Individual 300-word reflection from each partner | Not started | — | Submitted separately through Canvas, not stored here | Each partner writes their own |
| Deployed app (production URL) | Partial | #11 | https://b4gone.vercel.app serves the scaffold homepage from `main` (`7aa3a2b`) and passed the smoke check on 2026-11-04 | Deploy accounts (#20) and the features, then verify sign-in on production |
| GitHub repository with visible commits from both partners | Partial | — | See contribution balance | Jiaying's commits |

## Issue work carried by existing code

- **#3 add-item form:** the frozen HW3 Run B copy is outside this repository, on Chengling's machine. Its add-item commits (`5c4ffb9` test → `6f507f3` feat → `1d832d7` test → `fa53822` feat) touch `src/features/items/` (AddItemForm, NewItemPanel, item-schema, and their tests), `src/lib/dates.ts`, `src/lib/money.ts`, `src/components/ui/Button.tsx` and `FormField.tsx`, `src/app/items/new/page.tsx`, and `tests/e2e/add-item.spec.ts`, and add `zod` 4.6.7 and `@testing-library/user-event` 14.6.7. The #3 pull request labels these as imported existing code and adds new red/green commits for the midnight-date fix. The frozen copy stays unchanged.

## Optional

| Item | Status | Notes |
| --- | --- | --- |
| Receipt uploads | Optional | PRD could-have; only after the core features, tests, and deployment |
| AI receipt extraction | Optional | PRD could-have; manual entry must work without it |
| Mom Test interviews | Optional | See Steps 0–1 |
