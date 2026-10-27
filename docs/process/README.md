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
| Shared repository, both partners with push access | [char-lv/b4gone](https://github.com/char-lv/b4gone) | Partner push access not verified from the public API; **Pending** owner confirmation |
| Branch per issue, partner review before merge | [#13](https://github.com/char-lv/b4gone/pull/13) (`chore/1-project-rules`) and [#14](https://github.com/char-lv/b4gone/pull/14) (`docs/3-hw3-evidence`), each approved by Jasmine before merge | Followed so far |
| At least 5 genuine PR reviews per partner | Jasmine: 2 ([#13 review](https://github.com/char-lv/b4gone/pull/13#pullrequestreview-5644828250), [#14 review](https://github.com/char-lv/b4gone/pull/14#pullrequestreview-5645457036)). Charlene: 0 (no pull requests by Jasmine yet) | **Pending**: 3 more by Jasmine, 5 by Charlene |
| Meaningful commits from both partners | Charlene: 14 commits on `main` plus 2 merge commits. Jasmine: none yet | **Pending**: Jasmine's commits |
| Shared rules maintained by both partners | [AGENTS.md history](https://github.com/char-lv/b4gone/commits/main/AGENTS.md): Charlene's commits so far | **Pending**: Jasmine's rule changes |

## Engineering evidence

| Requirement | Evidence | Status |
| --- | --- | --- |
| TDD: failing test committed before implementation | #1 homepage: [`960aa11`](https://github.com/char-lv/b4gone/commit/960aa11) test → [`54b2916`](https://github.com/char-lv/b4gone/commit/54b2916) feat. The original failing output was not retained; a re-run on 2026-10-27 fails at `960aa11` (`Unable to find an accessible element with the role "heading" and name "B4Gone"`, 1 failed) and passes at `54b2916`. #1 database configuration: red/green commits on branch `chore/1-env-database-setup`, output in that pull request | Partly done; database configuration commits **Pending** merge |
| Unit, integration, and E2E tests | Vitest unit/component suite, Playwright smoke test, and (on `chore/1-env-database-setup`) a database connection integration suite | Feature tests **Pending** (#2–#10) |
| Multi-stage CI on every pull request, security scanning | Branch `chore/11-ci-pipeline`: CI, CodeQL, dependency audit and review | **Pending**: pull request and first run |
| Deploy previews, automated deployment, environment management | Branch `chore/11-ci-pipeline`: `docs/deployment.md` and the deployment smoke check; branch `chore/1-env-database-setup`: `docs/setup.md` environment matrix | **Pending**: no hosting account connected; no deployment exists |
| Production URL | None | **Pending** (#11) |

## Documentation and submission

| Requirement | Evidence | Status |
| --- | --- | --- |
| README | [README.md](../../README.md) | In progress (#12) |
| PRD and prototype | [docs/PRD.md](../PRD.md), prototype link in PRD Section 7 | Done |
| API documentation (OpenAPI/Swagger) | None | **Pending** (#12, after #2/#4/#7 endpoints exist) |
| Architecture and database schema diagrams | None | **Pending** (#12) |
| Setup and deployment guide | `docs/setup.md` and `docs/deployment.md` on the open branches | **Pending** merge |
| Sprint retrospectives | Sprint notes | **Pending** |
| Partner contribution log | [contribution-log.md](contribution-log.md) | Started |
| 10-minute demo video | None | **Pending** |
| Individual 300-word reflections | Submitted separately by each partner through Canvas, not stored here | **Pending** |

## HW3 experiment records

The HW3 rules comparison (#3) is personal homework and stays outside this repository (see AGENTS.md, Repository content). Charlene keeps the Run A and Run B working copies, a verified git bundle of Run B, and the patches locally. Run B's add-item commits (`5c4ffb9` test → `6f507f3` feat → `1d832d7` test → `fa53822` feat; local commits, not on GitHub) are the starting point for integrating #3; the integration pull request should say they were imported and add new TDD commits for the remaining midnight-date fix.
