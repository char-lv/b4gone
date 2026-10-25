# HW3 reflection: project rules, the PRD, and planning for Sprint 2

## How the PRD and design guided implementation

We asked Claude Code to build the same feature twice from the same code baseline (`hw3-baseline-v1`, `6741e37`): an add-item form that passes its data to an `onSubmit` callback. Run A received only a short request. Run B also had AGENTS.md, the PRD, and the prototype link. Model, tool version, runtime, and auto-memory settings were the same, but the supplied context differed as a bundle, so the result does not isolate the effect of AGENTS.md alone.

The PRD mattered most where the short request was ambiguous. Without it, run A chose a 200-character name limit, allowed future purchase dates, removed every comma from prices before validation, and cleared the draft without awaiting the callback. None of these choices is unreasonable for a generic form, but each conflicts with our requirements. Run B used the PRD's 100-character limit, compared purchase dates with an injected local today, rejected malformed amounts without rounding, awaited submission, blocked duplicate submits, and kept the draft after a failed save. It also followed our naming (`/items/new`, `AddItemForm`, `name`) and placed code in the feature, `lib`, and UI folders described in the rules.

On a shared 30-check review written after generation from the PRD, A passed 24 and B passed 30. The six A failures were exactly the cases above: the 101-character name, tomorrow's date, `1,,2`, and three pending or failed submission behaviors. The review was not preregistered and ran under jsdom rather than in a browser, so it supports a narrow claim: B matched this feature's specified behavior better in this pair of runs. A still showed useful habits without detailed guidance, such as a pure validation module and many invalid-input tests.

The design reference had a weaker, less verifiable effect. B reported opening the prototype and checking desktop and phone screenshots, and its UI added required/optional labels, hints, Cancel, and saving/retry states. We reviewed source code, not a side-by-side rendering, so visual fidelity remains a reported result. The generated suites (A: 40 unit/component and 2 browser tests; B: 84 and 5, as reported by each session) are different suites and should not be compared as a score. Database/API integration remained an unimplemented placeholder in both runs.

## How the board and sprints organize the work

The comparison depended on issue boundaries in the plan. Issue #1 produced the scaffold and test tooling; issue #3 defines the form and validation up to the callback; issue #4 holds persistence and authenticated APIs. Because #3 stopped at the callback, both runs could be compared without database or authentication work, and neither run needed to guess where saving belongs. Our rules require one branch per issue, issue references in commit messages, and red-green-refactor commits, and the GitHub Project board tracks Backlog, Sprint Todo, In Progress, In Review, and Done across the Sprint 1 and Sprint 2 milestones.

The process also exposed a gap. Run B's four commits alternate tests and implementation, but its report disclosed that an unpublished commit was split after it accidentally included implementation. That disclosure is preserved here. Commit order alone does not prove that tests were written and run before the code.

## What to improve for Sprint 2

1. **Stronger TDD evidence.** Save the actual failing test output with its commit SHA rather than relying on history, and disclose any split or reordered local commits. The refined AGENTS.md now says this.
2. **Clearer validation rules.** The rules now state that malformed separators such as `1,,2` are rejected rather than stripped, and that "local today" must be recomputed across midnight, a limitation B reported in its own form.
3. **Keep the rules current.** The original rules described a repository with only planning documents. They now describe the existing scaffold and the macOS 13 Chrome workaround for Playwright.
4. **Verify the UI.** Add browser screenshots or visual checks against the prototype for desktop and mobile instead of relying on reported inspection.
5. **Real integration tests.** Replace the pending placeholder with an isolated PostgreSQL suite as issue #4 lands, and keep evaluation-only checks out of implementation prompts.
