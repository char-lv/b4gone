# Partner contribution log

Who did what, with links to the actual records. Each partner adds their own entries; do not record planned or unverified work as done. Commits marked "AI-assisted" carry a `Co-Authored-By: Claude` trailer.

## Summary on 2026-10-28

| | Chengling (`char-lv`) | Jiaying (`Jasmine-G-uo`) |
| --- | --- | --- |
| Commits on `main` | 14 plus 2 merge commits ([list](https://github.com/char-lv/b4gone/commits/main/?author=char-lv)) | 0 |
| Pull requests authored | 2 merged: [#13](https://github.com/char-lv/b4gone/pull/13), [#14](https://github.com/char-lv/b4gone/pull/14). 4 open: [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16), [#17](https://github.com/char-lv/b4gone/pull/17), [#18](https://github.com/char-lv/b4gone/pull/18) | 0 |
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
| Pending | Jiaying | Wrote the formal project proposal | Location **Pending**: add the link or the Canvas submission reference |
| Pending | Jiaying | | |
