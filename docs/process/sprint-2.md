# Sprint 2

- Milestone: [Sprint 2](https://github.com/char-lv/b4gone/milestone/2), due 2026-11-12 (internal planning target; the P2 Canvas deadline is Nov 13 at 2:59 AM).
- Issues created: 2026-10-24 by `char-lv`.
- Scope from the milestone: subscriptions, billing and cost calculations, the dashboard, cross-view verification, CI/CD, and final documentation.

## Planning

Joint planning: the partners met on **2026-11-05**, planned Sprint 2 together, and started the main feature work that day. That fits GitHub: #8 was assigned to `char-lv` on 2026-11-05, and [#25](https://github.com/char-lv/b4gone/pull/25) (#8) merged the same day. Earlier, the 2026-10-25 recap ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792955442191349)) had split the twelve issues across two sprints, and the 2026-11-04 update ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793839618825829)) listed Sprint 2 planning as next.

| Date (PT) | Posted by | What it records | Link |
| --- | --- | --- | --- |
| 2026-11-08, 22:31 | Chengling | Summary of the 2026-11-05 planning meeting, written three days after it | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794205899082659) |
| 2026-11-08, 22:42 | Jiaying | Confirms the plan and the role rotation | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794206532613009) |

Jiaying also confirmed the 2026-11-05 date in her reviews of #31 ([first](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822290437), [second](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)).

The owners below are the current GitHub assignments: #7 and #8 `char-lv`, #9 and #10 `Jasmine-G-uo`; #11 and #12 have no assignee. #7 was originally suggested for Jiaying and was reassigned to Chengling on 2026-11-08, three days after the planning, so the planning did not settle #7's owner.

- Product Owner: Jiaying. Scrum Master: Chengling (the Sprint 1 roles swapped). Both partners agreed on these roles at the 2026-11-05 meeting. Jiaying confirmed them in Slack on 2026-11-08 ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794206532613009)) and in her reviews of #31 ([first](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822290437), [second](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)).

| Issue | Points | Priority | Suggested owner (unconfirmed) | Board status on 2026-10-28 | Evidence |
| --- | --- | --- | --- | --- | --- |
| [#7](https://github.com/char-lv/b4gone/issues/7) Subscription CRUD, cancel, reactivate | 5 | high | Chengling (assigned to `char-lv` on 2026-11-08; originally suggested for Jiaying) | Done (merged 2026-11-09 in [#29](https://github.com/char-lv/b4gone/pull/29)) | Migration `003`, owner-filtered repository, API routes, and pages with seven red/green pairs; next charges and the monthly average from #8; #9 handoff in [subscription-calculations.md](../subscription-calculations.md#saved-subscriptions-and-the-dashboard-handoff-7--9) |
| [#8](https://github.com/char-lv/b4gone/issues/8) Billing dates and average monthly cost | 3 | high | Chengling (assigned to `char-lv` on 2026-11-05) | Done (merged 2026-11-05 in [#25](https://github.com/char-lv/b4gone/pull/25)) | `nextBillingDate`, `nextRenewals`, and `averageMonthlyCostCents` with two red/green pairs; contract in [subscription-calculations.md](../subscription-calculations.md); [#25](https://github.com/char-lv/b4gone/pull/25) |
| [#9](https://github.com/char-lv/b4gone/issues/9) Dashboard | 5 | high | Jiaying (assigned to `Jasmine-G-uo`) | Backlog | Not started; reads subscriptions through the #7 handoff |
| [#10](https://github.com/char-lv/b4gone/issues/10) Synchronized views, accessibility, failure states | 3 | medium | Jiaying | Backlog | Not started |
| [#11](https://github.com/char-lv/b4gone/issues/11) CI checks, PR previews, automated deployment | 5 | high | Chengling (only the repository owner can connect Vercel) | In Progress | CI and security scanning merged in [#15](https://github.com/char-lv/b4gone/pull/15); production deploys from `main`, and the automated smoke check runs on every Vercel deployment since [#23](https://github.com/char-lv/b4gone/pull/23) (first runs 2026-11-09). Open: draft [#22](https://github.com/char-lv/b4gone/pull/22) (runtime alignment), branch protection, a formatter, and a database health check |
| [#12](https://github.com/char-lv/b4gone/issues/12) API, architecture, sprint, and demo docs | 3 | medium | Jiaying leads; both contribute | In Progress | Process notes in [#17](https://github.com/char-lv/b4gone/pull/17), open with review requested |

Total: 24 points. The suggested split is 13 points for Chengling and 11 for Jiaying plus shared #12 work. Rebalance at Sprint 2 planning from Sprint 1's actual velocity.

Dependencies: #8 provides the calculations that #7's views and #9's dashboard display; #10 verifies the finished flows; #12 documents the implemented API.

## Standups

At least three updates per partner per sprint. The Slack messages are in the course channel [#group_prject](https://app.slack.com/client/T0C0GQNGVMH/C0CB4SELD0A); opening a link needs access to the workspace. "Posted by" is who wrote the message. A message can describe both partners' work. The messages say what was true when they were posted; current status is on GitHub.

| Date (PT) | Posted by | Covers | Summary | Link |
| --- | --- | --- | --- | --- |
| 2026-11-08 | Jiaying | A section for each partner | Done, next, and blockers: the #8 calculations, the Items stack (#4–#6), reviews, migrations, and what subscriptions and the dashboard depend on | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794175414140039) |

Sprint 2 started with planning on 2026-11-05; Sprint 1 pull requests kept merging until 2026-11-08, so the two overlap. The 2026-11-04 post is listed under [Sprint 1](sprint-1.md#standups). The 2026-11-08 post names no sprint, but it came after the planning. Count so far: one post with a section for each partner. Jiaying agreed that such a post counts for both partners ([review](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)). **Pending:** at least two more real Sprint 2 updates covering each partner before the 2026-11-12 deadline.

## Retrospective

**Pending.** No Sprint 2 retrospective has been held. Hold it before the final submission, date it, and have each partner write their own feedback.

- What went well:
- What to improve:
- Action items (owner, due date):
- Chengling's feedback for Jiaying:
- Jiaying's feedback for Chengling:
- Shared-rules changes agreed (link the AGENTS.md pull request):
