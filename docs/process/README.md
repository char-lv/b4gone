# Process evidence index

This index links the evidence for the P2 process requirements. It lists only records that exist; anything not yet recorded is marked **Pending**. Last updated 2026-10-27.

Partners: Charlene Lv ([`char-lv`](https://github.com/char-lv), repository owner) and [`Jasmine-G-uo`](https://github.com/Jasmine-G-uo).

| Document | Contents |
| --- | --- |
| [sprint-1.md](sprint-1.md) | Sprint 1 plan, estimates, ownership, standups, and retrospective |
| [sprint-2.md](sprint-2.md) | Sprint 2 plan, estimates, ownership, standups, and retrospective |
| [contribution-log.md](contribution-log.md) | Who did what: commits, pull requests, and reviews |
| [ai-workflow.md](ai-workflow.md) | AI tools actually used, shared-rules history, and proposed rule changes |

## Agile process

| Requirement | Evidence | Status |
| --- | --- | --- |
| Two or more sprints as GitHub milestones with at least five issues each | [Sprint 1](https://github.com/char-lv/b4gone/milestone/1) (#1–#6, due 2026-10-30), [Sprint 2](https://github.com/char-lv/b4gone/milestone/2) (#7–#12, due 2026-11-12) | Done: six issues each |
| Sprint board | [B4Gone Development board](https://github.com/users/char-lv/projects/1): Backlog, Sprint Todo, In Progress, In Review, Done | Exists |
| User stories with acceptance criteria | [PRD Section 4](../PRD.md#4-user-stories-and-acceptance-criteria) (US-01–US-07) and the acceptance checklist in each issue | Done |
| Task estimation | Story points in each issue's Planning section; totals in the sprint notes | Done |
| Joint sprint planning | No meeting notes or chat record linked yet | **Pending**: both partners |
| Task ownership | No issue has an assignee | **Pending**: suggestions in the sprint notes need confirmation |
| Standups: at least 3 per partner per sprint | None recorded yet (0 of 6 per sprint) | **Pending**: posted in the course Slack channel, then linked in the sprint notes |
| Retrospective per sprint with feedback from both partners | None yet | **Pending**: end of each sprint |

## Pair workflow

| Requirement | Evidence | Status |
| --- | --- | --- |
| Shared repository, both partners with push access | [char-lv/b4gone](https://github.com/char-lv/b4gone); the collaborator API reports `write` permission for `Jasmine-G-uo` (checked 2026-10-27) | Done |
| Branch per issue, partner review before merge | [#13](https://github.com/char-lv/b4gone/pull/13) (`chore/1-project-rules`) and [#14](https://github.com/char-lv/b4gone/pull/14) (`docs/3-hw3-evidence`), each approved by Jasmine before merge. [#15](https://github.com/char-lv/b4gone/pull/15), [#16](https://github.com/char-lv/b4gone/pull/16), and [#17](https://github.com/char-lv/b4gone/pull/17) are open with Jasmine's review requested | Followed so far |
| At least 5 genuine PR reviews per partner | Jasmine: 2 ([#13 review](https://github.com/char-lv/b4gone/pull/13#pullrequestreview-5644828250), [#14 review](https://github.com/char-lv/b4gone/pull/14#pullrequestreview-5645457036)). Charlene: 0 (no pull requests by Jasmine yet) | **Pending**: 3 more by Jasmine, 5 by Charlene |
| Meaningful commits from both partners | Charlene: 14 commits on `main` plus 2 merge commits. Jasmine: none yet | **Pending**: Jasmine's commits |
| Shared rules maintained by both partners | [AGENTS.md history](https://github.com/char-lv/b4gone/commits/main/AGENTS.md): Charlene's commits so far | **Pending**: Jasmine's rule changes |

## Engineering evidence

| Requirement | Evidence | Status |
| --- | --- | --- |
| TDD: failing test committed before implementation | #1 homepage: [`960aa11`](https://github.com/char-lv/b4gone/commit/960aa11) test → [`54b2916`](https://github.com/char-lv/b4gone/commit/54b2916) feat. The original failing output was not retained; a re-run on 2026-10-27 fails at `960aa11` (`Unable to find an accessible element with the role "heading" and name "B4Gone"`, 1 failed) and passes at `54b2916`. #1 database configuration: red [`24e2633`](https://github.com/char-lv/b4gone/commit/24e2633) and [`ec5761d`](https://github.com/char-lv/b4gone/commit/ec5761d), green [`1f6b8eb`](https://github.com/char-lv/b4gone/commit/1f6b8eb), with the failing output in [#16](https://github.com/char-lv/b4gone/pull/16) | Partly done; database configuration commits **Pending** merge |
| Unit, integration, and E2E tests | Vitest unit/component suite, Playwright smoke test, and (in [#16](https://github.com/char-lv/b4gone/pull/16)) a database connection integration suite | Feature tests **Pending** (#2–#10) |
| Multi-stage CI on every pull request, security scanning | [#15](https://github.com/char-lv/b4gone/pull/15): CI, CodeQL, dependency audit and review ([run](https://github.com/char-lv/b4gone/actions/runs/40637667877)). [#16](https://github.com/char-lv/b4gone/pull/16) adds a PostgreSQL integration job ([run](https://github.com/char-lv/b4gone/actions/runs/40637696970): connected to PostgreSQL 17.11, 3 tests passed). Dependency review first failed because the dependency graph was off; the owner enabled it on 2026-10-27 and the re-runs passed ([#15 job](https://github.com/char-lv/b4gone/actions/runs/40637667877/job/122651726960), [#16 job](https://github.com/char-lv/b4gone/actions/runs/40637696970/job/122651734464)), so every job now passes on both pull requests. Secret scanning, push protection, and Dependabot alerts are still off | Passing; **Pending**: merge and the owner's decision on the other security settings |
| Deploy previews, automated deployment, environment management | [#15](https://github.com/char-lv/b4gone/pull/15): `docs/deployment.md` and the deployment smoke check; [#16](https://github.com/char-lv/b4gone/pull/16): `docs/setup.md` environment matrix | **Pending**: no hosting account connected; no deployment exists |
| Production URL | None | **Pending** (#11) |

## Documentation and submission

| Requirement | Evidence | Status |
| --- | --- | --- |
| README | [README.md](../../README.md) | In progress (#12) |
| PRD and prototype | [docs/PRD.md](../PRD.md), prototype link in PRD Section 7 | Done |
| API documentation (OpenAPI/Swagger) | None | **Pending** (#12, after #2/#4/#7 endpoints exist) |
| Architecture and database schema diagrams | None | **Pending** (#12) |
| Setup and deployment guide | `docs/setup.md` in [#16](https://github.com/char-lv/b4gone/pull/16) and `docs/deployment.md` in [#15](https://github.com/char-lv/b4gone/pull/15) | **Pending** merge |
| Sprint retrospectives | Sprint notes | **Pending** |
| Partner contribution log | [contribution-log.md](contribution-log.md) | Started |
| 10-minute demo video | None | **Pending** |
| Individual 300-word reflections | Submitted separately by each partner through Canvas, not stored here | **Pending** |

## HW3 experiment records

The HW3 rules comparison (#3) is personal homework and stays outside this repository (see AGENTS.md, Repository content). Charlene keeps the Run A and Run B working copies, a verified git bundle of Run B, and the patches locally. Run B's add-item commits (`5c4ffb9` test → `6f507f3` feat → `1d832d7` test → `fa53822` feat; local commits, not on GitHub) are the starting point for integrating #3; the integration pull request should say they were imported and add new TDD commits for the remaining midnight-date fix.
