# Partner contribution log

Who did what, with links to the actual records. Each partner adds their own entries; do not record planned or unverified work as done. Commits marked "AI-assisted" carry a `Co-Authored-By: Claude` trailer.

## Summary on 2026-10-28

| | Chengling (`char-lv`) | Jiaying (`Jasmine-G-uo`) |
| --- | --- | --- |
| Commits on `main` | 14 plus 2 merge commits ([list](https://github.com/char-lv/b4gone/commits/main/?author=char-lv)) | 0 |
| Pull requests authored | 2 merged: [#13](https://github.com/char-lv/b4gone/pull/13), [#14](https://github.com/char-lv/b4gone/pull/14). 5 open: [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16), [#17](https://github.com/char-lv/b4gone/pull/17), [#18](https://github.com/char-lv/b4gone/pull/18), [#19](https://github.com/char-lv/b4gone/pull/19) | 0 |
| Pull request reviews | 0 | 2 approvals: [#13](https://github.com/char-lv/b4gone/pull/13#pullrequestreview-5644828250), [#14](https://github.com/char-lv/b4gone/pull/14#pullrequestreview-5645457036) |
| AGENTS.md changes | 4 commits on `main`, plus the CLAUDE.md import | 0 |
| Standups | 0 recorded | 0 recorded |

Targets for P2: at least 5 genuine reviews per partner, substantial commits from both, and shared-rules changes from both.

## Log

| Date | Partner | Contribution | Evidence |
| --- | --- | --- | --- |
| 2026-10-24 | Chengling | Project overview README and approved PRD with prototype link | [`ee52723`](https://github.com/char-lv/b4gone/commit/ee52723), [`3f88ab9`](https://github.com/char-lv/b4gone/commit/3f88ab9) |
| 2026-10-24 | Chengling | Created issues #1–#12 with acceptance criteria and estimates in milestones Sprint 1 and Sprint 2 | [Issues](https://github.com/char-lv/b4gone/issues?q=is%3Aissue), [milestones](https://github.com/char-lv/b4gone/milestones) |
| 2026-10-24 | Chengling | Shared rules in AGENTS.md and the CLAUDE.md import (#1) | [`9fc085d`](https://github.com/char-lv/b4gone/commit/9fc085d), [`935efe4`](https://github.com/char-lv/b4gone/commit/935efe4), PR [#13](https://github.com/char-lv/b4gone/pull/13) |
| 2026-10-24 | Chengling (AI-assisted) | Next.js, TypeScript, Tailwind, Vitest, and Playwright scaffold; homepage test before implementation (#1) | [`866c630`](https://github.com/char-lv/b4gone/commit/866c630), [`960aa11`](https://github.com/char-lv/b4gone/commit/960aa11), [`54b2916`](https://github.com/char-lv/b4gone/commit/54b2916), [`6741e37`](https://github.com/char-lv/b4gone/commit/6741e37) |
| 2026-10-24 to 25 | Chengling (AI-assisted) | HW3 rules comparison and AGENTS.md refinement (#3); personal HW3 records moved out of the repository | [`c96d056`](https://github.com/char-lv/b4gone/commit/c96d056), [`f723561`](https://github.com/char-lv/b4gone/commit/f723561), [`4d64a01`](https://github.com/char-lv/b4gone/commit/4d64a01), PR [#14](https://github.com/char-lv/b4gone/pull/14) |
| 2026-10-25 | Jiaying | Reviewed and approved #13 (shared rules) | [Review](https://github.com/char-lv/b4gone/pull/13#pullrequestreview-5644828250) |
| 2026-10-25 | Jiaying | Reviewed and approved #14; reported running `npm ci`, lint, typecheck, `test:unit`, and build on Node 24.11.0, all passing | [Review](https://github.com/char-lv/b4gone/pull/14#pullrequestreview-5645457036) |
| 2026-10-25 | Chengling | Merged #13 and #14 after Jiaying's approvals | [`f63e121`](https://github.com/char-lv/b4gone/commit/f63e121), [`7820b4c`](https://github.com/char-lv/b4gone/commit/7820b4c) |
| 2026-10-27 | Chengling (AI-assisted) | P2 preparation: CI, security scanning, and deployment preparation (#11); environment and database setup with TDD (#1); these process notes (#12) | [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16), [#17](https://github.com/char-lv/b4gone/pull/17), open with Jiaying's review requested |
| 2026-10-28 | Both | Confirmed ownership: Jiaying owns #2 (accounts); Chengling owns #3–#5 (items). Chengling assigned the issues on GitHub | [#2](https://github.com/char-lv/b4gone/issues/2), [#3](https://github.com/char-lv/b4gone/issues/3), [#4](https://github.com/char-lv/b4gone/issues/4), [#5](https://github.com/char-lv/b4gone/issues/5); the date and link of the agreement are **Pending** |
| 2026-10-28 | Chengling (AI-assisted) | Verified the development and test databases locally for the first time (Docker PostgreSQL 17.11): `db:check`, the test-database check, and the integration suite passed; bound the documented Docker port to localhost (#1) | [#16 comment](https://github.com/char-lv/b4gone/pull/16#issuecomment-6481501119), [`ba9a622`](https://github.com/char-lv/b4gone/commit/ba9a622) |
| 2026-10-28 | Chengling (AI-assisted) | Connected Vercel (Hobby). The first production build failed in `npm ci`; diagnosed the npm 11.19.1 lockfile error and opened the lockfile fix, whose preview build succeeded (#11) | [#11 comment](https://github.com/char-lv/b4gone/issues/11#issuecomment-6482116957), [#18](https://github.com/char-lv/b4gone/pull/18) |
| 2026-10-28 | Chengling (AI-assisted) | Team names and confirmed owners in the process notes; added the P2 completion tracker (#12) | [#17](https://github.com/char-lv/b4gone/pull/17), [P2_CHECKLIST.md](../P2_CHECKLIST.md) |
| 2026-10-28 | Chengling (AI-assisted) | Issue and pull request templates (#12) | [#19](https://github.com/char-lv/b4gone/pull/19) |
| 2026-11-04 | Chengling (AI-assisted) | Add-item form (#3): imported the HW3 Run B form as labeled existing code and added three red/green fixes (midnight date, locked fields during a save with server field errors, item API payload validation) | [#24](https://github.com/char-lv/b4gone/pull/24) |
| 2026-11-05 | Chengling (AI-assisted) | Reviewed Jiaying's accounts pull request (#2) at `3d09579`: re-ran its three new red/green pairs, the full local suite, and extra redirect probes, then approved and merged it. Merged `main` into the add-item branch (#3) and moved the form into the signed-in layout with a new red/green pair | [#20 review](https://github.com/char-lv/b4gone/pull/20#pullrequestreview-5790377098), [#24](https://github.com/char-lv/b4gone/pull/24) |
| 2026-11-05 | Chengling (AI-assisted) | Merged #24 after CI passed on the integrated head. Billing dates and average monthly cost (#8): two red/green pairs and a refactor, with the calculation contract for #7 and #9 | [#24](https://github.com/char-lv/b4gone/pull/24), [#25](https://github.com/char-lv/b4gone/pull/25) |
| 2026-11-05 | Jiaying | Reviewed the billing calculation pull request (#8): re-ran its red/green pairs and the full suite, compared `nextBillingDate` with a brute-force check, approved, and merged it | [#25](https://github.com/char-lv/b4gone/pull/25) |
| 2026-11-05 | Jiaying | Item persistence (#4): items migration, owner-filtered repository, item API routes, Items list and details pages, and saving from the add-item form, with six red/green pairs and an amount limit that fits the database column | `feature/4-item-api` |
| 2026-11-05 to 2026-11-06 | Jiaying | Self-review rounds on #4: item and root error pages, item titles and focus after a save, row headers, invisible and multi-line names, the price-limit message, Cancel during a save, and the root error text, with five more red/green pairs; re-ran the earlier red commits to record their failing counts | `feature/4-item-api` |
| 2026-11-08 | Jiaying | Item actions (#5): edit page, three endpoints (`PUT` and `DELETE /api/items/{id}`, `PUT /api/items/{id}/status`), return and undo, delete with a confirmation dialog, and the item's dashboard deadlines on its details page, with six red/green pairs; Playwright flows added after the code | `feature/5-item-actions` |
| 2026-11-08 | Jiaying | Tests for #6: malformed price separators, another user restoring a returned item, and one end-to-end purchase flow from sign-in to delete; checked the other #6 criteria against the tests from #4 and #5 | `feature/6-item-tests` |
| 2026-11-08 | Chengling (AI-assisted) | Approved the Items stack (#26–#28) at its reviewed heads and posted the merge plan: apply `002` to production before #26, merge commits to keep the TDD SHAs, retarget #27 and #28 one at a time | [#26 comment](https://github.com/char-lv/b4gone/pull/26#issuecomment-6728302176) |
| 2026-11-08 | Jiaying | Applied `002_create_items` to production with read-only checks before and after, then merged #26, #27, and #28 with merge commits | [#26](https://github.com/char-lv/b4gone/pull/26), [#27](https://github.com/char-lv/b4gone/pull/27), [#28](https://github.com/char-lv/b4gone/pull/28) |
| 2026-11-08 | Chengling (AI-assisted) | Subscriptions (#7): migration `003`, shared validation, owner-filtered repository, API routes, and the list, details, add, and edit pages with cancel/reactivate and confirmed delete, in seven red/green pairs; the #9 handoff; and a phone-width fix for the three-section navigation | `feature/7-subscriptions` |
| 2026-11-08 | Jiaying | Dashboard (#9): one 30-day event list from item deadlines and subscription renewals, the two summary cards, Within 7 days and In 8–30 days groups linking to each record, and the empty, loading, and error states, with three red/green pairs | `feature/9-dashboard` |
| Pending | Jiaying | Wrote the formal project proposal | Location **Pending**: add the link or the Canvas submission reference |
| Pending | Jiaying | | |
