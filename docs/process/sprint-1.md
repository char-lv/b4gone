# Sprint 1

- Milestone: [Sprint 1](https://github.com/char-lv/b4gone/milestone/1), due 2026-10-30 (internal planning target; Canvas sets the official deadlines).
- Issues created: 2026-10-24 by `char-lv`.
- Scope from the milestone: project setup and shared rules, private accounts, and the purchase-item flow (add, view, edit, delete, return/undo) with tests.

## Planning

Joint planning record: **Pending.** Add the date, attendees, and a link to the meeting notes or Slack thread, and confirm the estimates and remaining owners below together.

- Confirmed by both partners: Jiaying owns #2 and Chengling owns #3–#5. The issues were assigned on GitHub on 2026-10-28. The date and link of that agreement are **Pending**.
- Product Owner and Scrum Master for Sprint 1: **Pending** joint decision. The roles swap in Sprint 2.

| Issue | Points | Priority | Owner | Board status on 2026-10-28 | Evidence |
| --- | --- | --- | --- | --- | --- |
| [#1](https://github.com/char-lv/b4gone/issues/1) Next.js project and shared rules | 3 | high | Unconfirmed; work so far by Chengling | In Review | [#13](https://github.com/char-lv/b4gone/pull/13) and [#14](https://github.com/char-lv/b4gone/pull/14) merged; the last open criterion (`.env.example` and documented commands) is in [#16](https://github.com/char-lv/b4gone/pull/16), open with review requested |
| [#2](https://github.com/char-lv/b4gone/issues/2) Registration, sign-in, sign-out | 5 | high | Jiaying (confirmed; assigned to `Jasmine-G-uo`) | Done (merged 2026-11-05) | [#20](https://github.com/char-lv/b4gone/pull/20), approved by Chengling at `3d09579` |
| [#3](https://github.com/char-lv/b4gone/issues/3) Add-item form and HW3 comparison | 5 | high | Chengling (confirmed; assigned to `char-lv`) | In Review (2026-11-04) | HW3 comparison done (submitted through Canvas). Form imported from Run B with new red/green fixes in [#24](https://github.com/char-lv/b4gone/pull/24); moved into the signed-in layout after #2 merged |
| [#4](https://github.com/char-lv/b4gone/issues/4) Item APIs and persistence | 5 | high | Jiaying (reassigned; assigned to `Jasmine-G-uo`) | In Review | Items table, item API, Items list and details, and saving from the add-item form on `feature/4-item-api` |
| [#5](https://github.com/char-lv/b4gone/issues/5) Edit, delete, return, restore | 5 | high | Jiaying (reassigned; assigned to `Jasmine-G-uo`) | In Review | Edit page, return and undo, delete with confirmation, and the item's dashboard deadlines on `feature/5-item-actions`, which builds on #4 |
| [#6](https://github.com/char-lv/b4gone/issues/6) Validation, isolation, and flow tests | 3 | medium | Jiaying (assigned to `Jasmine-G-uo`) | In Review | Most cases were added with #4 and #5. `feature/6-item-tests` adds malformed price separators, another user restoring a returned item, and one end-to-end purchase flow |

Total: 26 points. Confirmed so far: Chengling 5 points (#3) and Jiaying 15 points (#2, #4, #5; #4 and #5 were reassigned to her). #6 (3 points) is assigned to Jiaying on GitHub. #1 (3 points) has no confirmed owner. Each partner needs five reviews of the other's pull requests, so when assigning the Sprint 2 issues, check that both partners will author enough pull requests.

Dependencies: #4 needs the session owner from #2 and the form from #3; #5 builds on #4; #6 covers #2–#5.

Risk on 2026-10-28: two days remain before the milestone date (2026-10-30), and #2, #4, #5, and #6 have no branch or pull request yet. Decide together at the next standup whether to keep the date or move work to Sprint 2, and record the decision here.

## Standups

At least three updates per partner, posted in the course Slack channel. Copy the link and a one-line summary of each real update; do not fill rows in advance.

| Date | Partner | Done | Next | Blockers | Link |
| --- | --- | --- | --- | --- | --- |
| Pending | Chengling | | | | |
| Pending | Chengling | | | | |
| Pending | Chengling | | | | |
| Pending | Jiaying | | | | |
| Pending | Jiaying | | | | |
| Pending | Jiaying | | | | |

## Retrospective

**Pending.** Hold it after the last Sprint 1 pull request is reviewed, and have both partners write their own feedback.

- What went well:
- What to improve:
- Action items (owner, due date):
- Chengling's feedback for Jiaying:
- Jiaying's feedback for Chengling:
- Shared-rules changes agreed (link the AGENTS.md pull request):
