# Sprint 2

- Milestone: [Sprint 2](https://github.com/char-lv/b4gone/milestone/2), due 2026-11-12 (internal planning target; the P2 Canvas deadline is Nov 13 at 2:59 AM).
- Issues created: 2026-10-24 by `char-lv`.
- Scope from the milestone: subscriptions, billing and cost calculations, the dashboard, cross-view verification, CI/CD, and final documentation.

## Planning

Joint planning record: **Pending.** The 2026-10-25 recap ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1792955442191349)) split the twelve issues across two sprints, but no Sprint 2 planning meeting or message was found. The 2026-11-04 update ([message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793839618825829)) lists Sprint 2 planning as upcoming work. The owners below come from GitHub assignments: #7 and #8 `char-lv`, #9 and #10 `Jasmine-G-uo`; #11 and #12 have no assignee.

- Product Owner and Scrum Master for Sprint 2: **Pending**, like Sprint 1. AGENTS.md says the roles swap each sprint, but no record shows who held them.

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
| 2026-11-04 | Chengling | A section for each partner | Done, next, and blockers: accounts (#2), the add-item form (#3), reviews, deployment, and the #4 handoff. Lists the Sprint 1 retrospective and Sprint 2 planning as next | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1793839618825829) |
| 2026-11-08 | Jiaying | A section for each partner | Done, next, and blockers: the #8 calculations, the Items stack (#4–#6), reviews, migrations, and what subscriptions and the dashboard depend on | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794175414140039) |

Neither message names a sprint. They are listed here by date because they came after the Sprint 1 milestone date (2026-10-30), but the Nov 4 post still reports Sprint 1 work. **Pending:** the partners confirm when Sprint 2 started and which sprint each post belongs to. Even if both count for Sprint 2, that is two posts per partner, so at least one more real update from each partner is needed.

## Retrospective

**Pending.** No Sprint 2 retrospective has been held. Hold it before the final submission, date it, and have each partner write their own feedback.

- What went well:
- What to improve:
- Action items (owner, due date):
- Chengling's feedback for Jiaying:
- Jiaying's feedback for Chengling:
- Shared-rules changes agreed (link the AGENTS.md pull request):
