# Sprint 2

- Milestone: [Sprint 2](https://github.com/char-lv/b4gone/milestone/2), due 2026-11-12 (internal planning target). The P2 specification gives the deadline as Thursday, November 12, 2026, 11:59 PM PT; Canvas sets the actual submission deadline.
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

| Issue | Points | Priority | Suggested owner (unconfirmed) | Status on 2026-11-10 | Evidence |
| --- | --- | --- | --- | --- | --- |
| [#7](https://github.com/char-lv/b4gone/issues/7) Subscription CRUD, cancel, reactivate | 5 | high | Chengling (assigned to `char-lv` on 2026-11-08; originally suggested for Jiaying) | Done (merged 2026-11-09 in [#29](https://github.com/char-lv/b4gone/pull/29)) | Migration `003`, owner-filtered repository, API routes, and pages with seven red/green pairs; next charges and the monthly average from #8; #9 handoff in [subscription-calculations.md](../subscription-calculations.md#saved-subscriptions-and-the-dashboard-handoff-7--9) |
| [#8](https://github.com/char-lv/b4gone/issues/8) Billing dates and average monthly cost | 3 | high | Chengling (assigned to `char-lv` on 2026-11-05) | Done (merged 2026-11-05 in [#25](https://github.com/char-lv/b4gone/pull/25)) | `nextBillingDate`, `nextRenewals`, and `averageMonthlyCostCents` with two red/green pairs; contract in [subscription-calculations.md](../subscription-calculations.md); [#25](https://github.com/char-lv/b4gone/pull/25) |
| [#9](https://github.com/char-lv/b4gone/issues/9) Dashboard | 5 | high | Jiaying (assigned to `Jasmine-G-uo`) | Done (merged 2026-11-09 in [#30](https://github.com/char-lv/b4gone/pull/30)) | Deadline count, average monthly cost, and the 30-day event list, reading subscriptions through the #7 handoff; three red/green pairs; approved by Chengling at `9fad79c` ([review](https://github.com/char-lv/b4gone/pull/30#pullrequestreview-5822700987)) |
| [#10](https://github.com/char-lv/b4gone/issues/10) Synchronized views, accessibility, failure states | 3 | medium | Jiaying (assigned to `Jasmine-G-uo`) | Done (merged 2026-11-10) | [#33](https://github.com/char-lv/b4gone/pull/33), approved by Chengling at `9cf520d`. Seven Playwright checks in `tests/e2e/sync.spec.ts`: edits and deletions reaching the dashboard and both averages, dates crossing the 30-day window and the 7-day boundary, an open dashboard past midnight, double-clicked saves, forms at 375 px with a focus ring, and no failing requests while editing or deleting; a hand test of the deployed site on 2026-11-09. The #9 TDD wording fix from the #30 review is in the same pull request; the two console 404s did not reproduce |
| [#11](https://github.com/char-lv/b4gone/issues/11) CI checks, PR previews, automated deployment | 5 | high | Chengling (only the repository owner can connect Vercel) | In Progress | CI and security scanning merged in [#15](https://github.com/char-lv/b4gone/pull/15); production deploys from `main`, and the automated smoke check runs on every Vercel deployment since [#23](https://github.com/char-lv/b4gone/pull/23) (first runs 2026-11-09). Open: draft [#22](https://github.com/char-lv/b4gone/pull/22) (runtime alignment), branch protection, a formatter, and a database health check |
| [#12](https://github.com/char-lv/b4gone/issues/12) API, architecture, sprint, and demo docs | 3 | medium | Jiaying leads; both contribute | In Progress | Process notes, templates, and the tracker in [#17](https://github.com/char-lv/b4gone/pull/17), [#19](https://github.com/char-lv/b4gone/pull/19), and [#21](https://github.com/char-lv/b4gone/pull/21); the architecture and database diagrams, design notes, project report, and Slack records in [#31](https://github.com/char-lv/b4gone/pull/31) (merged 2026-11-10). Still open: retrospectives, the demo video, and the reflections |

Total: 24 points. The suggested split is 13 points for Chengling and 11 for Jiaying plus shared #12 work. Rebalance at Sprint 2 planning from Sprint 1's actual velocity.

Dependencies: #8 provides the calculations that #7's views and #9's dashboard display; #10 verifies the finished flows; #12 documents the implemented API.

## Standups

At least three updates per partner per sprint. The Slack messages are in the course channel [#group_prject](https://app.slack.com/client/T0C0GQNGVMH/C0CB4SELD0A); opening a link needs access to the workspace. "Posted by" is who wrote the message. A message can describe both partners' work. The messages say what was true when they were posted; current status is on GitHub.

| Date (PT) | Posted by | Covers | Summary | Link |
| --- | --- | --- | --- | --- |
| 2026-11-08 | Jiaying | A section for each partner | Done, next, and blockers: the #8 calculations, the Items stack (#4–#6), reviews, migrations, and what subscriptions and the dashboard depend on | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794175414140039) |
| 2026-11-09, 11:24 | Chengling | A section for each partner | Titled "Standup — November 8" but published on 2026-11-09 | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794252296299819) |
| 2026-11-10 | Chengling | A section for each partner | Done, next, and blockers: the #30, #31, and #32 merges, #22's runtime check, the #10 checks in #33, the 404 investigation, the retrospective drafts in #34, and the demo segments | [message](https://aicodingneusj.slack.com/archives/C0CB4SELD0A/p1794358361253489) |

Sprint 2 started with planning on 2026-11-05; Sprint 1 pull requests kept merging until 2026-11-08, so the two overlap. The 2026-11-04 post is listed under [Sprint 1](sprint-1.md#standups). The 2026-11-08 post names no sprint, but it came after the planning. Count: three posts with a section for each partner (published 2026-11-08, 2026-11-09, and 2026-11-10). The 2026-11-08 planning summary and confirmation are planning records, not standups. The partners agreed ([review](https://github.com/char-lv/b4gone/pull/31#pullrequestreview-5822547817)) that such a post counts for both of them; the instructor has not confirmed this.

## Retrospective

**Retrospective, 2026-11-10.**

- What went well:
  - The features merged within a few days: #8 on 2026-11-05, #7 and #9 on 2026-11-09, and #10 on 2026-11-10.
  - `003` went to the Neon preview branch first and to production before #7 merged, with read-only checks before and after ([record](https://github.com/char-lv/b4gone/pull/29#issuecomment-6730624159)).
  - Both partners tested the deployed site by hand on 2026-11-09, and #10 added the cross-view checks that were missing.
  - The project report, diagrams, and tracker were kept in step with what was merged (#31, #32).
- What to improve:
  - Several documentation pull requests (#31, #32, #33) changed the same files at once, so we spent time on merge conflicts. Next time we would agree who edits the tracker and sprint notes in which pull request.
- Action items (owner, due date):
  - Record the demo video: Jiaying 0:00–5:00, Chengling 5:00–10:00 (both, before the Canvas deadline).
  - Submit the individual reflections on Canvas (each partner, before the Canvas deadline).
  - Close #10–#12 and the Sprint 2 milestone after the last pull requests merge (both, before the Canvas deadline).
- Chengling's feedback for Jiaying: Jiaying carried the Items stack (#4–#6) through #26–#28 and then built the dashboard ([#30](https://github.com/char-lv/b4gone/pull/30)), reusing `itemDeadlines`, `nextRenewals`, and `averageMonthlyCostCents` instead of writing new date or cost logic. Both production migrations were handled carefully: `002` and `003` went to the Neon preview branch first and to production before the code that needed them merged, with checks before and after. Jiaying's review of #29 was thorough: checking out `61c8b71`, running the unit, integration, and Playwright suites locally, and clicking through the subscription pages next to the prototype before approving. During my review of #30, the TDD wording fix and the console 404s went straight into #10, and #33 turned them into seven new Playwright checks plus an 18-step hand test of the deployed site. Jiaying also answered my questions on #31 about the roles and the planning date quickly, which let me finish the sprint records. One thing for next time: stacking #33 and #34 on documentation branches meant extra retargeting at the end. Basing each one on `main` after the previous merge would be simpler.
- Jiaying's feedback for Chengling: Chengling did excellent work this sprint. She delivered subscriptions (#7) and the billing and cost rules (#8), with a clear contract in [subscription-calculations.md](../subscription-calculations.md) that made the dashboard (#9) straightforward to build. Her review of #30 checked the dashboard locally and pointed out that the TDD record overstated how my reds failed, which kept our evidence honest. She also wrote most of the project report and diagrams and kept every document accurate. She was quick to answer and easy to work with.
- Shared-rules changes: the open proposals in [ai-workflow.md](ai-workflow.md#proposed-rule-changes-for-joint-review) were reviewed. Proposal 1 is already how we work: every AI session is recorded in ai-workflow.md. Proposal 3 is partly how we work: a red commit that uses a stub says so in its message, but not every such red fails on its own assertion (`e667c22`'s stub threw before any assertion ran). AGENTS.md did not need another change this sprint.
