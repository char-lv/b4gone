# AI workflow and shared rules

The P2 specification names Antigravity as the primary AI harness for Weeks 6–8. The professor has since confirmed that any IDE is acceptable (link to that confirmation: **Pending**). The team uses VS Code with Claude Code, guided by the shared AGENTS.md. This page records the AI tools the team has actually used, how context reaches them, and how AGENTS.md has changed. Add an entry for every AI session that produces committed work.

## Recorded AI use

| Date | Partner | Tool and model | Work | Evidence |
| --- | --- | --- | --- | --- |
| 2026-10-24 to 25 | Chengling | Claude Code with Claude Opus 5.5 | Scaffold, homepage TDD pair, and HW3 documentation (#1, #3) | Commits with the `Co-Authored-By: Claude` trailer, listed in [contribution-log.md](contribution-log.md) |
| 2026-10-24 | Chengling | Claude Code CLI 2.1.308, Opus 5.5, medium effort, two fresh sessions | HW3 controlled comparison: run A without project rules, run B with AGENTS.md, the PRD, and the prototype (#3) | HW3 submission on Canvas; local run records outside the repository |
| 2026-10-27 | Chengling | Claude Code desktop app (Code tab), Opus 5.5 | Baseline verification; CI, security scanning, and deployment preparation (#11); environment and database setup with TDD (#1); these process notes (#12) | Pull requests [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16), and [#17](https://github.com/char-lv/b4gone/pull/17) |
| 2026-10-28 | Chengling | Claude Code VS Code extension, Opus 5.5 | P2 preparation audit, issue assignments for #2–#5, team names and owners in these notes, and the P2 completion tracker (#12) | Pull request [#17](https://github.com/char-lv/b4gone/pull/17) and [P2_CHECKLIST.md](../P2_CHECKLIST.md) |
| Pending | Jiaying | | | |

For each new entry, record the issue, what the agent was asked to do, which checks were run, and what was kept, changed, or rejected after human review.

## How context reaches the agent

- **Shared rules:** root [AGENTS.md](../../AGENTS.md). Claude Code loads it through the one-line root `CLAUDE.md` import (`@AGENTS.md`). Each partner confirms this once in their own VS Code setup with `/memory` or `/context`. Chengling: confirmed on 2026-10-28, when the session context showed `CLAUDE.md` importing the AGENTS.md rules. Jiaying: **Pending**.
- **Task:** the GitHub issue body (goal, acceptance criteria, estimate, PRD reference).
- **Behavior and design:** [docs/PRD.md](../PRD.md) and the prototype linked in its Section 7.
- **Verification:** the npm scripts in the README, CI on every pull request, and partner review before merge.

## AI-assisted TDD record

| Issue | Red | Green | Notes |
| --- | --- | --- | --- |
| #1 homepage | [`960aa11`](https://github.com/char-lv/b4gone/commit/960aa11) | [`54b2916`](https://github.com/char-lv/b4gone/commit/54b2916) | The original failing output was not kept. A re-run on 2026-10-27 fails at `960aa11` (1 failed: no heading named "B4Gone") and passes at `54b2916` |
| #1 database URL configuration | [`24e2633`](https://github.com/char-lv/b4gone/commit/24e2633): Tests 27 failed (27) against a stub that only declares the interface | [`1f6b8eb`](https://github.com/char-lv/b4gone/commit/1f6b8eb): Tests 28 passed (28) | A second test commit, [`ec5761d`](https://github.com/char-lv/b4gone/commit/ec5761d), corrected one example after the first implementation showed that `localhost:5432 b4gone_dev` parses as a URL (still red: 28 failed). The branch was rebased before publishing; red and green were re-run at the published SHAs. Details are in [#16](https://github.com/char-lv/b4gone/pull/16) |

## Shared-rules history

| Commit | Change | Reason |
| --- | --- | --- |
| [`9fc085d`](https://github.com/char-lv/b4gone/commit/9fc085d) | Initial shared rules: stack, architecture, product rules, testing, security, and pair workflow (#1) | Project start |
| [`935efe4`](https://github.com/char-lv/b4gone/commit/935efe4) | CLAUDE.md imports AGENTS.md (#1) | One source of rules for Claude Code |
| [`c96d056`](https://github.com/char-lv/b4gone/commit/c96d056) | Reject malformed money separators such as `1,,2`; recompute local today across midnight; honest TDD evidence (#3) | Observed in the HW3 comparison |
| [`f723561`](https://github.com/char-lv/b4gone/commit/f723561) | Corrected the scaffold and command status (#3) | Keep the rules accurate |
| [`4d64a01`](https://github.com/char-lv/b4gone/commit/4d64a01) | Personal homework records stay outside the repository (#3) | Separate shared and individual work |
| [`61f1ff0`](https://github.com/char-lv/b4gone/commit/61f1ff0) and [`89646b7`](https://github.com/char-lv/b4gone/commit/89646b7) in [#16](https://github.com/char-lv/b4gone/pull/16), not merged | Database configuration, the integration suite, and `db:check` (#1); the configured CI pipeline and environment guides (#11) | Rules must describe the actual setup |

## Proposed rule changes for joint review

These proposals have not been applied. Discuss them at planning or the retrospective; either partner can open the AGENTS.md pull request that adopts the agreed ones.

1. Record every AI session that produces committed work in this file: tool, model, issue, request summary, checks run, and what was kept or rejected.
2. Withdrawn on 2026-10-28: this proposal covered Antigravity, but the team uses VS Code with Claude Code, which the Loading shared instructions section already covers.
3. A red commit may include a stub that only declares the interface, so each test fails on its own assertion; the commit message must say so.
4. If TDD commits are rebased before publishing, re-run the red and green states at the published SHAs and report both runs.
5. A pull request that adds an environment variable also updates `.env.example` (placeholder only), the environment matrix in `docs/setup.md`, and the hosting provider's scoped settings.
