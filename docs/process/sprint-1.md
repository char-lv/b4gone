# Sprint 1

- Milestone: [Sprint 1](https://github.com/char-lv/b4gone/milestone/1), due 2026-10-30 (internal planning target; Canvas sets the official deadlines).
- Issues created: 2026-10-24 by `char-lv`.
- Scope from the milestone: project setup and shared rules, private accounts, and the purchase-item flow (add, view, edit, delete, return/undo) with tests.

## Planning

The partners planned the project and Sprint 1 in meetings and recapped them in Slack. The Slack messages are in the course channel [#group_prject](https://app.slack.com/client/T0C0GQNGVMH/C0CB4SELD0A); opening a link needs access to the workspace. "Posted by" is who wrote the message. A message can describe both partners' work. The messages say what was true when they were posted; current status is on GitHub.

| Date (PT) | Posted by | What it records | Link |
| --- | --- | --- | --- |
| 2026-10-24 | Chengling | Recap of a joint meeting: the team chose B4Gone, agreed the must-have and optional scope, and named the PRD, mockups, issues, and assignments as next steps | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792877581950459) |
| 2026-10-25 | Jiaying | Agrees with the scope and next steps in that recap | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792951707135869) |
| 2026-10-25 | Jiaying | Recap of the follow-up discussion: PRD and prototype, twelve issues across two sprints, the shared rules, and review as next steps | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792955442191349) |
| 2026-10-27 | Chengling | Acknowledges Jiaying's notes | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793165663100119) |
| 2026-10-28 | Chengling | Both partners met to review progress and confirm Sprint 1 responsibilities; lists each partner's work, next steps, and the dependencies between them | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793219652400559) |

- Owners: the 2026-10-28 meeting confirmed Sprint 1 responsibilities, and the issues were assigned on GitHub that day: #2 to Jiaying and #3–#5 to Chengling. On 2026-11-04 Chengling reassigned #4 to Jiaying ([record in #4](https://github.com/char-lv/b4gone/issues/4#issuecomment-6644022894)). #5 and #6 were also assigned to Jiaying, and she implemented #4–#6 ([#26](https://github.com/char-lv/b4gone/pull/26)–[#28](https://github.com/char-lv/b4gone/pull/28)). #1 has no assignee; the work was Chengling's.
- Product Owner: Chengling. Scrum Master: Jiaying. Both partners agreed on these roles at the 2026-11-05 meeting. Jiaying confirmed them in Slack on 2026-11-08 ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794206532613009)) and in her reviews of #31 ([first](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822290437), [second](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)).

| Issue | Points | Priority | Owner | Status on 2026-11-10 | Evidence |
| --- | --- | --- | --- | --- | --- |
| [#1](https://github.com/char-lv/b4gone/issues/1) Next.js project and shared rules | 3 | high | Unconfirmed; work so far by Chengling | Done (closed 2026-10-31) | [#13](https://github.com/char-lv/b4gone/pull/13), [#14](https://github.com/char-lv/b4gone/pull/14), and [#16](https://github.com/char-lv/b4gone/pull/16) merged |
| [#2](https://github.com/char-lv/b4gone/issues/2) Registration, sign-in, sign-out | 5 | high | Jiaying (confirmed; assigned to `Jasmine-G-uo`) | Done (merged 2026-11-05) | [#20](https://github.com/char-lv/b4gone/pull/20), approved by Chengling at `3d09579` |
| [#3](https://github.com/char-lv/b4gone/issues/3) Add-item form and HW3 comparison | 5 | high | Chengling (confirmed; assigned to `char-lv`) | Done (merged 2026-11-05; closed 2026-11-08) | HW3 comparison submitted through Canvas; form imported from Run B with new red/green fixes in [#24](https://github.com/char-lv/b4gone/pull/24) |
| [#4](https://github.com/char-lv/b4gone/issues/4) Item APIs and persistence | 5 | high | Jiaying (reassigned; assigned to `Jasmine-G-uo`) | Done (merged 2026-11-08) | [#26](https://github.com/char-lv/b4gone/pull/26), approved by Chengling at `7c7a314`; `002_create_items` applied to production before the merge |
| [#5](https://github.com/char-lv/b4gone/issues/5) Edit, delete, return, restore | 5 | high | Jiaying (reassigned; assigned to `Jasmine-G-uo`) | Done (merged 2026-11-08) | [#27](https://github.com/char-lv/b4gone/pull/27), approved by Chengling at `31a6dfc` |
| [#6](https://github.com/char-lv/b4gone/issues/6) Validation, isolation, and flow tests | 3 | medium | Jiaying (assigned to `Jasmine-G-uo`) | Done (merged 2026-11-08) | [#28](https://github.com/char-lv/b4gone/pull/28), approved by Chengling at `921fa9e` |

Total: 26 points, all done. By owner: Chengling 5 points (#3) and Jiaying 18 points (#2, #4, #5, #6; #4 and #5 were reassigned to her). #1 (3 points) has no confirmed owner; the work was Chengling's. Each partner needs five reviews of the other's pull requests, so check the Sprint 2 split for that too.

Dependencies: #4 needs the session owner from #2 and the form from #3; #5 builds on #4; #6 covers #2–#5. After the reassignment, #3 (Chengling) fed #4 and #5 (both Jiaying).

Risk on 2026-10-28: two days remain before the milestone date (2026-10-30), and #2, #4, #5, and #6 have no branch or pull request yet. Decide together at the next standup whether to keep the date or move work to Sprint 2, and record the decision here.

Status on 2026-11-09: all six Sprint 1 issues are closed. #1 closed on 2026-10-31, before the milestone date; #2 and #3 merged on 2026-11-05 and #4–#6 on 2026-11-08, after it. No joint decision about the late date is recorded.

## Standups

The course asks for at least three standups per partner per sprint. For this sprint the Slack records are shared posts: one partner wrote the message, and some of them have a section for each partner.

| Date (PT) | Posted by | Covers | Summary | Link |
| --- | --- | --- | --- | --- |
| 2026-10-24 | Chengling | Team recap | Agreed scope and next steps; no separate done/next/blocker sections | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792877581950459) |
| 2026-10-25 | Jiaying | Team recap | Team progress and next steps; no separate sections | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792955442191349) |
| 2026-10-28 | Chengling | A section for each partner | Labeled Sprint 1: each partner's completed work, next work, and dependencies | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793219652400559) |
| 2026-10-30 | Jiaying | A section for each partner | Labeled Sprint 1: done, next, and blockers for setup, reviews, databases, deployment, and accounts | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793420722222249) |
| 2026-11-04 | Chengling | A section for each partner | Done, next, and blockers: accounts (#2), the add-item form (#3), reviews, deployment, and the #4 handoff. Lists the Sprint 1 retrospective and Sprint 2 planning as next | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793839618825829) |

Sprint 1 ran until Sprint 2 planning on 2026-11-05 (see [sprint-2.md](sprint-2.md#planning)), so the 2026-11-04 post belongs here. It names no sprint, but it was posted before that planning. Count: three posts with a section for each partner (Oct 28, Oct 30, Nov 4), plus two team recaps. By author, Chengling posted two of the three and Jiaying one. Jiaying agreed in her review of #31 ([review](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)) that a post with a section for each partner counts as a standup for both. Read that way, each partner has three for Sprint 1. This is the partners' own reading; the instructor has not confirmed that this format meets the course requirement. Do not add or backdate messages.

## Retrospective

**Retrospective, 2026-11-10.** Facts below come from the issues, pull requests, and Slack posts linked above.

- What went well:
  - The scaffold, CI with CodeQL, and the Vercel deployment were in place before the feature work, so every feature pull request had tests, a security scan, and a preview from the start (#1, #11).
  - Reviews caught real problems before merge. Chengling's review of #20 found an open redirect through control characters by running the redirect helper and URL parsing on that commit ([comment](https://github.com/char-lv/b4gone/pull/20#issuecomment-6643732714)), and it was fixed test-first.
  - The red commits kept the failing output in their messages, so the reviewer could replay them.
- What to improve:
  - Standups were not on fixed days.
- Action items (owner, due date):
  - Post standups on fixed days (both, from Sprint 2).
- Chengling's feedback for Jiaying: Jiaying built the whole account system for #2 ([#20](https://github.com/char-lv/b4gone/pull/20)): the migration runner, bcrypt hashing that rejects passwords over 72 bytes instead of truncating them, signed session cookies, origin checks, and the route proxy. Its nine red/green pairs kept their failing output, so I could replay them when I reviewed. When I reported that `/\t/example.com` got past the redirect check, Jiaying pushed a failing test and the fix the same evening (`c56627c` → `0f26aa7`), and also changed the migration steps to use direct connections. Jiaying reviewed and merged my setup pull requests #15–#19 on Oct 31, and took over #4 without delay when I reassigned it. One thing for next time: both of our Sprint 1 pull requests landed after the milestone date. Splitting large changes like #20 into smaller pull requests would let us review and merge earlier.
- Jiaying's feedback for Chengling: Chengling did a lot of the groundwork that made the rest possible: the scaffold, the CI pipeline with CodeQL, the Vercel setup, and the lockfile fix for Vercel. Her add-item form (#3) caught and fixed the stale "today" bug test-first. Her reviews were thorough and easy to act on: she found the open redirect in #20 by running the redirect helper on that commit and gave me the exact input, so I could write the failing test right away. Handing #4 to me with a written record in the issue also made the switch clear.
- Shared-rules changes: AGENTS.md was set up and refined during this sprint through [#13](https://github.com/char-lv/b4gone/pull/13), [#14](https://github.com/char-lv/b4gone/pull/14), [#16](https://github.com/char-lv/b4gone/pull/16), and [#17](https://github.com/char-lv/b4gone/pull/17). New ideas from the sprint were collected as proposals in [ai-workflow.md](ai-workflow.md#proposed-rule-changes-for-joint-review).
