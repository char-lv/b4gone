# Design notes

The visual reference is the approved prototype, a Claude artifact linked in [PRD Section 7](../PRD.md#7-ui-design-reference):

https://claude.ai/artifact/CPRyvxx7bDpjMWau2JmddM?sk=1KRqQph1BLUcx5C4NxUw-g

It shows the Dashboard, Items, and Subscriptions pages. The PRD decides behavior where the prototype does not show a state, such as errors, loading, or a failed save. This folder does not have screenshots of the prototype or of the built pages yet.

## Tokens in use

The built app takes its look from the theme in [`src/app/globals.css`](../../src/app/globals.css). These values were copied by hand from the prototype when the first pages were built (#2, #3). They were not generated from a `DESIGN.md` file. This page describes them and changes nothing.

| Token | Value | Used for |
| --- | --- | --- |
| `canvas` | `#f7f7f5` | Page background (off-white) |
| `surface` | `#ffffff` | Cards, tables, dialogs |
| `ink` | `#24292b` | Body text (charcoal) |
| `muted` | `#5f6669` | Hints, secondary text |
| `line` | `#e3e5e2` | Card and table borders |
| `accent` | `#1f5d4c` | Primary buttons, links, focus outline (deep green) |
| `accent-soft` | `#e8f0ec` | Active status tags, icon backgrounds |
| `urgent` | `#b42318` | Destructive actions and urgency only (red) |
| `radius-card` / `radius-control` | 10px / 6px | Cards / buttons and inputs |
| `shadow-card` | Two light shadows | Cards; no heavy outlines |

The font is Public Sans, loaded with `next/font`. Pages sit in a column up to `max-w-5xl` with 20px side padding.

## Patterns the pages follow

- **Forms** use `FormField`: a visible label, a "(required)" or "(optional)" marker, a hint, and an error linked with `aria-describedby`. On a failed submit, the form shows how many fields need fixing and moves focus to the first one. While saving, the fields are read-only and the button says "Saving…", so a second click does nothing.
- **Lists** are real tables with a row header for the record name. They have an empty state with an Add action, a loading state, and an error panel with Try again.
- **Status** is shown as a tag with text ("Active", "Returned", "Cancelled"), not color alone. Dates near today get text such as "Due today" or "In 3 days".
- **Delete** opens `ConfirmDialog`. The dialog opens with focus on the safe choice ("Keep subscription"), closes with Esc, and returns focus to the button that opened it.
- **Keyboard:** every action is a real button or link, a "Skip to main content" link comes first, and the focus outline is a 3px accent ring.
- **Phone width:** the header tabs wrap under the wordmark at 375px. Playwright tests check that `/items`, `/subscriptions` (#7), and `/dashboard` (#9) do not scroll sideways.

## Compared with the course checklist

The companion checklist ("Building P2 from Zero", Step 2) recommends a mockup in `docs/design/` and a root `DESIGN.md` in the Google Labs format. It also recommends linting that file and generating the Tailwind theme from it. These are recommendations, not items in the P2 rubric. The rubric's related item is "UI/UX polish" (5 points).

| Checklist step | State |
| --- | --- |
| Mockup in `docs/design/` | The prototype is linked here. Screenshots are not added yet |
| Root `DESIGN.md` with tokens | Not written. The tokens are listed on this page instead |
| `npx @google/design.md lint` | Not run, because there is no `DESIGN.md` |
| Tailwind theme generated from `DESIGN.md` | Not done. Regenerating the theme would change `globals.css`, so it belongs in its own reviewed pull request, not in a documentation change |
| AGENTS.md says "UI work follows `DESIGN.md`" | Not done. AGENTS.md points UI work to the prototype and the PRD |

The partners decide whether to add `DESIGN.md` before submission. If they do, it should describe the values above, not new ones.
