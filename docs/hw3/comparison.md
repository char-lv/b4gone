# B4Gone: the same add-item form with and without project rules

## What stayed the same

Both runs started with the application code and test tooling from `hw3-baseline-v1` (`6741e37adabd367e4356f5fc83b613ace8978070`). The feature was a purchase form that calls an `onSubmit` callback. Database persistence, authentication, CRUD APIs, and the dashboard were outside this experiment.

The sessions used Claude Code 2.1.308, Opus 5.5 (`claude-opus-5-5`), medium effort, auto permission mode, and disabled auto memory. Both used Node 24.11.0 and the existing system-Chrome workaround for browser tests. Screenshots confirmed no project memory files in A and the CLAUDE.md/AGENTS.md import in B. Built-in tools and skill descriptions were shared context; this was not an experiment without any system instructions.

A's standalone repository omitted project rules, PRD, prototype references, and planning sections of the README. It had no old history or remote from which to recover them. B retained those materials. The initial application source, tests, configuration, and lockfile were identical. B later added pinned Zod 4.6.7 and Testing Library user-event 14.6.7 while implementing the feature; those are output differences, not baseline differences.

## What changed in the outputs

| Area | A: brief request | B: rules, PRD, and design reference |
| --- | --- | --- |
| Route and naming | `/purchases/new`, `NewPurchaseForm`, `itemName` | `/items/new`, `AddItemForm`, `name` |
| Organization | A reusable component and a separate pure validation module | Feature module, shared date/money helpers, reusable UI controls, and a Zod draft schema |
| Name limit | Chose 200 characters | Used the PRD's 100-character limit |
| Purchase date | Allowed future dates | Compared against an injected local today |
| Money | Preserved cents and blank versus zero, but removed all commas before validation | Preserved cents and blank versus zero; rejected malformed amounts without rounding |
| Pending submission | Did not await the callback; cleared the draft immediately | Awaited the callback, prevented duplicate submissions, and retained the draft after rejection |
| UI and tests | Labels, associated errors, focus on the first invalid field, and a happy-path browser flow | Required/optional labels, hints, Cancel, saving/retry states, keyboard tests, and additional date/validation cases |

A was useful: it separated validation from React and covered many invalid inputs without a detailed specification. B followed the project's terminology and behavior more closely. The difference was the supplied context bundle—rules, PRD, and prototype—not a measurement of AGENTS.md alone.

## Checks and independent review

The completion reports said A passed 40 unit/component tests and 2 browser tests; B passed 84 unit/component tests and 5 browser tests. Both reported passing lint, type checks, coverage thresholds, and a production build. Those counts describe different generated suites and should not be compared as a shared score. Database/API integration remained an unimplemented placeholder in both runs.

After both runs finished, I applied the same 30 review checks to their original source files without changing either implementation. This checklist was assembled after generation from the existing product requirements; it was not a preregistered benchmark or supplied in the implementation prompts. It covered name/date/money validation, optional values, and asynchronous callback behavior. Validation used a fixed local today of `2026-10-24`; React checks used jsdom. The script used TypeScript transpilation and one shared React runtime, not a browser or production build.

| Shared review | A | B |
| --- | --- | --- |
| Checks passed | 24/30 | 30/30 |

A failed six checks: rejecting a 101-character name, rejecting tomorrow's purchase date, rejecting `1,,2`, keeping the draft while the callback is pending, blocking a second pending submission, and retaining the draft with a retry error after an asynchronous rejection. B passed these checks. Full results are in `review-results.json`; `evaluate.cjs.txt` contains the actual review script. Its default paths point to the two original local run folders and it requires their installed dependencies.

## Limits and rule changes to make next

These results support a narrower conclusion: B matched this feature's specified behavior better in this pair of runs. They do not establish general model performance, complete accessibility, security, or full-project test coverage.

B reported opening the prototype and inspecting desktop/phone screenshots. This review inspected the source, not a side-by-side rendering against the prototype, so visual fidelity remains a reported result. B also noted that its local-today value can become stale across midnight. Its four commits alternate test and implementation changes, but the completion report disclosed splitting an unpublished commit after it accidentally included implementation. Preserve that disclosure; commit order alone does not prove when tests were actually run.

The proposed rules revision updates the stale scaffold/command descriptions, makes malformed separator rejection explicit, requires handling local midnight, and clarifies evidence preservation and TDD reporting. `AGENTS.before.md`, `AGENTS.refinement-proposal.md`, and `rules-refinement.patch` preserve the proposed before/after change. The proposal has not been applied to the canonical repository or to either experiment copy.
