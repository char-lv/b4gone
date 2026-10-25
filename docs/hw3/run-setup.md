# HW3 run setup record

Prepared 2026-10-24 from tag `hw3-baseline-v1` (commit `6741e37adabd367e4356f5fc83b613ace8978070`, tree `e3a716568688330f5901fcc0bc986d3f3c0e5a2d`).

## Working copies

| | Run A (rules disabled) | Run B (rules active) |
| --- | --- | --- |
| Folder | `/Users/charlenelv/claude_projects/b4gone-hw3-a` | `/Users/charlenelv/claude_projects/b4gone-hw3-b` |
| Git | Standalone repo, branch `main`, one commit `9b753b7`, no remote, no rules/PRD in history | Standalone repo, branch `main`, one commit `26ca64d`, no remote; tree identical to the tag |
| AGENTS.md / CLAUDE.md | Absent | Present (CLAUDE.md imports AGENTS.md) |
| docs/PRD.md and prototype URL | Absent | Present |
| README.md | Title, setup, commands, and Playwright note only | Unchanged from the tag |
| App code, tests, config, package-lock.json, .nvmrc | Identical to B | Identical to the tag |
| `.claude/settings.local.json` | `{"autoMemoryEnabled": false}` (git-excluded) | Same |

Both copies were installed with `npm ci` and checked before either run: lint, typecheck, test:unit, test:coverage, build, and `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e` all exited 0; `test:integration` exits 1 as the intentional pending placeholder. Build output was removed afterward.

## Residual references in run A

These are application code or configuration and are kept identical in both copies:

- `package.json` `test:integration` message mentions "See AGENTS.md" (file absent in A).
- `next.config.ts` comment mentions AGENTS.md; `agentRules: false` also stops `next dev` from creating an AGENTS.md in A.
- `src/app/page.tsx` and `src/app/layout.tsx` describe return deadlines, warranties, and subscription renewals.

## Instruction sources checked

- Ancestor folders (`/Users/charlenelv/claude_projects`, `/Users/charlenelv`, `/Users`, `/`): no CLAUDE.md, CLAUDE.local.md, AGENTS.md, `.claude/CLAUDE.md`, or `.claude/rules`.
- User level: no `~/.claude/CLAUDE.md` or `~/.claude/rules`; `~/.claude/settings.json` is `{}`; no plugins installed.
- Managed policy: no `/Library/Application Support/ClaudeCode/`; org `policy-limits.json` exists (restrictions/defaults, not project instructions); `remote-settings.json` is `{}`.
- Existing auto memory lives in `~/.claude/projects/-Users-charlenelv/memory/` and was not modified. Neither copy had a memory folder.

## Shared context that cannot be disabled (same for both runs)

- Claude Code's built-in system prompt and tool descriptions (CLI 2.1.308; the desktop app adds its own app prompt if used instead).
- User skills `job-application` and `job-application-epm` from `~/.claude/skills/` are listed by name/description in both sessions.
- The organization's managed policy limits.
