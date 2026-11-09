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
- Product Owner and Scrum Master for Sprint 1: **Pending.** None of the messages above names them. If the partners agreed on roles, record who held each one and where that was decided. Do not fill this in after the fact without that record.

| Issue | Points | Priority | Owner | Board status on 2026-11-04 | Evidence |
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

Count: two posts with a section for each partner (Oct 28 and Oct 30), plus two team recaps. That is fewer than three per partner, even if a shared post counts for both partners. **Pending:** the partners confirm whether a section in a shared post counts as that partner's standup and whether the team recaps count. Do not add or backdate messages to fill the gap.

## Retrospective

**Pending.** No retrospective was found in the Slack channel; the 2026-11-04 update ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793839618825829)) lists the Sprint 1 retrospective as upcoming work. Hold it together, date it, and have each partner write their own feedback.

- What went well:
- What to improve:
- Action items (owner, due date):
- Chengling's feedback for Jiaying:
- Jiaying's feedback for Chengling:
- Shared-rules changes agreed (link the AGENTS.md pull request):
