# B4Gone project report

This is the overview for the P2 submission: what B4Gone does today, how it is built, how we checked it, and what is still missing. It links to the detailed documents instead of repeating them. Facts are as of `main` at `06cdda5` on 2026-11-09, after the dashboard merged.

Team: Chengling Lv ([`char-lv`](https://github.com/char-lv)) and Jiaying Guo ([`Jasmine-G-uo`](https://github.com/Jasmine-G-uo)).

## Links for grading

| What | Where |
| --- | --- |
| Repository | https://github.com/char-lv/b4gone |
| Production | https://b4gone.vercel.app |
| Requirements and prototype | [PRD](PRD.md); the prototype link is in its Section 7 |
| API documentation | [api/openapi.yaml](api/openapi.yaml) (OpenAPI 3.1) |
| Architecture and database diagrams | [architecture.md](architecture.md) |
| Setup and deployment | [setup.md](setup.md), [deployment.md](deployment.md) |
| Board and milestones | [Project board](https://github.com/users/char-lv/projects/1); [Sprint 1](https://github.com/char-lv/b4gone/milestone/1) and [Sprint 2](https://github.com/char-lv/b4gone/milestone/2) |
| Sprint notes and Slack records | [process/sprint-1.md](process/sprint-1.md), [process/sprint-2.md](process/sprint-2.md) |
| Who did what | [process/contribution-log.md](process/contribution-log.md) |
| AI use and TDD record | [process/ai-workflow.md](process/ai-workflow.md) |
| Requirement status | [P2_CHECKLIST.md](P2_CHECKLIST.md) |
| Demo video | **Pending**: not recorded yet |
| Individual reflections | Submitted separately by each partner through Canvas, not stored here |

## What B4Gone does

B4Gone keeps purchase deadlines and subscription renewals in one place. A user adds what they bought, with its return deadline and warranty expiration, and adds their monthly or yearly subscriptions. The app shows when the next charge is due and what the active plans cost per month on average.

These parts are on `main` and deployed:

| Feature | Issue | Pull request (author → reviewer) | Merged |
| --- | --- | --- | --- |
| Register, sign in, sign out, private pages | #2 | [#20](https://github.com/char-lv/b4gone/pull/20) (Jiaying → Chengling) | 2026-11-05 |
| Add-item form | #3 | [#24](https://github.com/char-lv/b4gone/pull/24) (Chengling → Jiaying) | 2026-11-05 |
| Next billing date and average monthly cost | #8 | [#25](https://github.com/char-lv/b4gone/pull/25) (Chengling → Jiaying) | 2026-11-05 |
| Saved items: list, details, owner-only API | #4 | [#26](https://github.com/char-lv/b4gone/pull/26) (Jiaying → Chengling) | 2026-11-08 |
| Edit, return and undo, confirmed delete | #5 | [#27](https://github.com/char-lv/b4gone/pull/27) (Jiaying → Chengling) | 2026-11-08 |
| Item validation, isolation, and flow tests | #6 | [#28](https://github.com/char-lv/b4gone/pull/28) (Jiaying → Chengling) | 2026-11-08 |
| Subscriptions: add, list, details, edit, cancel, reactivate, confirmed delete | #7 | [#29](https://github.com/char-lv/b4gone/pull/29) (Chengling → Jiaying) | 2026-11-09 |
| Dashboard: deadline count, average monthly cost, 30-day list in two groups | #9 | [#30](https://github.com/char-lv/b4gone/pull/30) (Jiaying → Chengling) | 2026-11-09 |

The Dashboard shows two cards: the number of deadlines in the next 30 days and the average monthly subscription cost. Below them is one list of return, warranty, and renewal dates from today through day 30, split into "Within 7 days" and "In 8–30 days". Each row opens its record. Cross-view, accessibility, and failure-state checks (#10, Jiaying) are end-to-end tests in `tests/e2e/sync.spec.ts`. Receipt uploads and AI receipt extraction were optional in the PRD and were not built.

## How it is built

One Next.js 16 app serves the pages and the JSON API. Pages read the database on the server, and every change goes through an API route that checks the origin, the session, and the input before calling an owner-scoped repository. PostgreSQL 17 stores three tables: `users`, `items`, and `subscriptions`. [architecture.md](architecture.md) has the request-flow, database, and environment diagrams.

The decisions that shaped the code:

- **Date-only values stay strings.** Deadlines and billing anchors are `DATE` columns, read as `YYYY-MM-DD`, and "today" comes from the user's time zone. A date cannot move a day because of UTC. The add-item form imported from HW3 read today only once, so a form opened at 23:59 still rejected a purchase made after midnight as "in the future". #3 fixed it test-first (red [`6931ca0`](https://github.com/char-lv/b4gone/commit/6931ca0) → green [`c7268fe`](https://github.com/char-lv/b4gone/commit/c7268fe)).
- **Money is integer cents, parsed strictly.** `1,,2`, `1,200`, `-5`, and `15.999` are rejected with a message instead of being cleaned up or rounded. A blank item price is `null`, which is different from `0`.
- **One 404 for anything not yours.** Every SQL statement filters by `owner_id` from the verified session. Another user's id gets the same answer as a missing one.
- **Next charges are calculated, never stored.** The #8 functions derive the next charge from the original first billing date. Cancelling and reactivating therefore cannot shift it, and a January 31 anchor still lands on March 31 after a short February.
- **No extra infrastructure.** We used plain parameterized SQL with numbered migrations instead of an ORM, and `router.refresh()` after saves instead of a client state store. AGENTS.md asks for the simplest tool that covers the feature.

## How we checked it

**TDD.** Each feature pull request has red commits before green ones, with the failing output in the commit message. The [TDD record](process/ai-workflow.md#ai-assisted-tdd-record) lists them. It also labels where a red failed only on a missing import, and which tests were written after their code.

**Automated tests on `main`.** CI on `7db64cd` ([run](https://github.com/char-lv/b4gone/actions/runs/42566087629)) passed all of the following:

- 603 unit and component tests in 47 files, with coverage of 92.15% lines, 88.72% statements, 89.13% functions, and 85.25% branches.
- 148 integration tests against a disposable PostgreSQL 17 service.
- 41 Playwright tests.

After #30 merged, CI on `06cdda5` ([run](https://github.com/char-lv/b4gone/actions/runs/42579382300)) passed 621 unit and component tests in 50 files (91.91% lines, 88.51% statements, 89.12% functions, 85.5% branches), 148 integration tests, and 46 Playwright tests.

The integration suites include two-user checks for every item and subscription operation. The Playwright suites cover sign-in, add with field errors fixed by keyboard, a failed save that keeps the draft, edit, return and undo, cancel and reactivate, confirmed delete, phone width, and a second account that sees nothing. The dashboard suite adds the 30-day window and groups, and the count and average changing after a return or cancellation.

**Security checks.** `npm audit`, dependency review on pull requests, and CodeQL (`security-extended`) run in CI. CodeQL flagged a dynamic regular expression in a #7 test, and we replaced it with static matchers instead of suppressing the alert.

**Deployment.** Merges to `main` deploy to Vercel production. `deployment-smoke.yml` checks each deployment's homepage; the run after #21 merged reported `7db64cd` ([run](https://github.com/char-lv/b4gone/actions/runs/42566222197)). After #30 merged, the run reported `06cdda5` ([run](https://github.com/char-lv/b4gone/actions/runs/42579535653)). The smoke check does not sign in. On 2026-11-09 we also checked production by hand with an invented account: we added a labeled subscription, cancelled it, reactivated it, edited it, and deleted it ([record in #11](https://github.com/char-lv/b4gone/issues/11#issuecomment-6732546792)). Database migrations are applied to the Neon preview branch first, then to production before the merge, with checks before and after ([`003` record](https://github.com/char-lv/b4gone/pull/29#issuecomment-6730624159)).

**Review.** Each merged pull request was approved by the other partner first. As of 2026-11-09, Jiaying has approved 13 of Chengling's pull requests (including this documentation pull request, #31), and Chengling has approved 5 of Jiaying's. The fifth was #30, approved at `9fad79c` after local unit, Playwright, and browser checks ([review](https://github.com/char-lv/b4gone/pull/30#pullrequestreview-5822700987)).

## Known limitations

- Two Chrome console lines, `Failed to load resource: 404`, appeared in a local run during the #30 review. Their source is unconfirmed: listeners on every response, in that review and again in #10, recorded no 4xx response from the site. #10 keeps a Playwright check that editing and deleting send no failing requests.
- Signed-in checks on production were done by hand: Chengling's subscription flow on 2026-11-09, and Jiaying's 18-step test the same day with invented accounts (accounts, items with return and undo, subscriptions with cancel and reactivate, the dashboard, a failed save, keyboard use, 375 px, and a second account). The automated smoke check covers the homepage only.
- There is no health route that queries the database, no seed script, no formatter, and no branch protection on `main`.
- Local and CI use Node 24.11.0 / npm 11.6.1, while Vercel builds with Node 24.22.2 / npm 11.19.1. Draft [#22](https://github.com/char-lv/b4gone/pull/22) proposes aligning them; both partners still have to upgrade and agree.
- Previews are behind Vercel Authentication. On the Hobby plan only the owner can open them in a browser.
- There are no email or push reminders, which the PRD excludes. Reminders exist only on the dashboard.

## Demo outline (10 minutes)

The video is not recorded yet. This outline uses only features that are deployed today. Use an invented account and invented records.

| Time | Segment | What to show |
| --- | --- | --- |
| 0:00–0:45 | Problem | Deadlines live in receipts and emails; B4Gone keeps them in one place. Show the PRD's must-haves |
| 0:45–1:45 | Accounts | Register, sign out, show that `/items` redirects to sign-in, sign back in |
| 1:45–3:30 | Items | Add an item with a wrong price (`1,,2`) and a return deadline before the purchase date; fix both with the keyboard; save; open details; mark it returned, then undo; edit it |
| 3:30–5:15 | Subscriptions | Add a $15.99 monthly plan anchored on Jan 31 and show the next charge. Add a yearly plan and show the average monthly cost. Cancel one and watch the average change, then reactivate it and show the same anchor |
| 5:15–6:00 | Dashboard | The two cards, the 30-day list with its two groups and urgency labels, and a row opening its record. Return the item from earlier and show that its events leave |
| 6:00–6:30 | Delete | Delete a record through the confirmation dialog; show the 404 for its old URL |
| 6:30–8:00 | Engineering | A red/green commit pair in GitHub, a CI run with its stages, CodeQL, and the Vercel preview on a pull request |
| 8:00–9:15 | Teamwork | The board, a partner review with comments, the Slack planning and progress messages, and the contribution log |
| 9:15–10:00 | AI use and limits | How AGENTS.md and the PRD guided the agent, one change that review rejected or corrected, and the known limitations above |

After recording, add the link to the table at the top of this page and to [P2_CHECKLIST.md](P2_CHECKLIST.md).
