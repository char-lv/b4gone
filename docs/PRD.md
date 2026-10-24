# B4Gone — Product Requirements Document

## 1. Product overview

B4Gone keeps purchase deadlines and subscription renewals in one place. Users can record what they bought, check when a return window or warranty ends, and see upcoming subscription charges before they happen.

The website is for people who manage their own purchases and subscriptions and currently keep that information in receipts, emails, or separate notes. The first release focuses on entering records, keeping them up to date, and checking upcoming deadlines.

## 2. Scope

| Priority | Feature | Included |
| --- | --- | --- |
| Must have | Account access | Register, sign in, sign out, and access only the current user's records. |
| Must have | Item management | Add, view, edit, and delete purchases; record return and warranty dates; mark an item as returned or undo that status. |
| Must have | Subscription management | Add, view, edit, and delete monthly or yearly subscriptions; calculate the next billing date; cancel and reactivate a subscription. |
| Must have | Dashboard | Show upcoming deadlines, emphasize dates within seven days, and display average monthly subscription cost. |
| Could have | Receipt uploads | Attach and view receipt images or PDFs for an item. |
| Could have | AI receipt extraction | Suggest an item name, purchase date, and price from a receipt image or order screenshot. The user reviews the suggestions before saving. |

Receipt uploads and AI extraction are optional additions after the core features, testing, and deployment are complete. Manual entry must work independently.

The MVP uses USD and displays upcoming deadlines on the dashboard. Email and push notifications, multiple currencies, bank integrations, and shared accounts or household records are outside the scope.

## 3. Data and business rules

### Items

| Field | Requirement |
| --- | --- |
| Name | Required; 1–100 characters after trimming whitespace. |
| Purchase date | Required; a valid calendar date on or before today. |
| Price (USD) | Optional; a nonnegative amount with no more than two decimal places. Blank and zero are different values. |
| Return deadline | Optional; a valid date on or after the purchase date. |
| Warranty expiration | Optional; a valid date on or after the purchase date. |
| Status | Active or returned. New items start as active. |

Users enter return and warranty dates directly. The MVP does not look up store policies or estimate a warranty period.

Marking an item as returned keeps its record and removes its return and warranty reminders. Undoing that status restores any reminders that still fall within the dashboard window. Deleting an item removes the record and its reminders after confirmation.

### Subscriptions

| Field | Requirement |
| --- | --- |
| Service name | Required; 1–100 characters after trimming whitespace. |
| Amount (USD) | Required; a nonnegative amount with no more than two decimal places. |
| Billing cycle | Monthly or yearly. |
| First billing date | Required; a valid calendar date used as the recurring billing anchor. |
| Status | Active or cancelled. New subscriptions start as active. |

The next billing date is the first billing occurrence on or after today. A charge scheduled for today is due today.

For monthly billing, keep the original day of the month and use the month's last day when needed. A January 31 anchor produces February's last day and then March 31. For yearly billing, a February 29 anchor produces February 28 in non-leap years and February 29 in leap years.

Cancelling a subscription keeps its record but removes it from reminders and cost totals. Reactivating it recalculates the next billing date from the original anchor. Deletion requires confirmation.

### Dashboard and costs

- Include return deadlines and warranty expirations for active items, plus the next billing date of each active subscription.
- Show dates from today through 30 days from today, inclusive. Exclude past deadlines.
- Each active subscription contributes at most one renewal event: its next billing date.
- An item can contribute two events if its return and warranty dates both fall within the window. Label the total as deadlines, not items.
- Sort events by date, then event type and record name. Optional sections for `Within 7 days` and `In 8–30 days` must preserve this order and must not duplicate events.
- Highlight dates from today through seven days from today, inclusive. Add a text label such as `Due today` or `In 3 days`; color alone is insufficient.
- Each event opens the corresponding item or subscription.
- Calculate `Average monthly subscription cost` as active monthly amounts plus one-twelfth of active yearly amounts. Round the final displayed total to cents. This is an average, not the amount actually charged in the current month.
- Show an empty state with an action to add an item or subscription when no deadlines are upcoming.

### Dates, money, and updates

Use the user's local calendar date for today and store deadlines as date-only values. A date must not move to another day because of a time-zone conversion.

Store entered monetary amounts as integer cents. Reject negative values, malformed input, and amounts with more than two decimal places rather than silently rounding the input.

Creating, editing, deleting, returning, cancelling, or reactivating a record must update every affected list, detail view, dashboard event, and cost total after a successful save. Keep unsaved input when a save fails and show an error the user can act on.

## 4. User stories and acceptance criteria

### US-01 — Access a private account

As a user, I want to sign in so that only I can access my purchases and subscriptions.

- [ ] I can register, sign in, and sign out.
- [ ] Private pages and API operations require authentication.
- [ ] I cannot access or change another user's records by changing a record ID.
- [ ] Invalid credentials show a clear error.

### US-02 — Add a purchase

As a user, I want to record a purchase and its deadlines so that I can track it later.

- [ ] The form contains Name, Purchase date, Price (USD), Return deadline, and Warranty expiration, in that order.
- [ ] The form follows the item validation rules in Section 3 and marks required fields.
- [ ] Invalid fields show specific errors and prevent submission.
- [ ] A valid save creates one active item owned by my account and shows confirmation.
- [ ] The item appears in my list, and eligible deadlines appear on the dashboard.

### US-03 — Keep purchase records up to date

As a user, I want to view, edit, and delete purchases so that my records stay accurate.

- [ ] I can open item details from the list and edit the current values.
- [ ] Editing follows the same validation rules as creation.
- [ ] A successful edit updates the detail view, list, and dashboard.
- [ ] Deleting asks for confirmation and removes the record and its reminders.
- [ ] Empty, loading, and error states are available.

### US-04 — Record a return

As a user, I want to mark a purchase as returned so that I stop seeing its reminders.

- [ ] I can mark an active item as returned and undo the change.
- [ ] The item's status appears in the list and detail view.
- [ ] Returned items have no dashboard events.
- [ ] Undoing a return restores only events that are still within the dashboard window.

### US-05 — Manage subscriptions

As a user, I want to maintain my subscriptions so that I can track recurring spending.

- [ ] I can add, view, edit, and delete a subscription.
- [ ] The form follows the subscription validation rules in Section 3.
- [ ] The list and detail view show the amount, billing cycle, status, and next billing date.
- [ ] The billing calculation handles short months, leap years, and charges due today.
- [ ] Editing or deleting updates the dashboard and monthly average.
- [ ] Empty, loading, and error states are available.

### US-06 — Cancel or reactivate a subscription

As a user, I want to record whether a subscription is active so that reminders and cost totals stay accurate.

- [ ] Cancelling keeps the subscription record and removes it from renewal reminders and cost totals.
- [ ] Reactivating restores the subscription and recalculates its next billing date.
- [ ] The list, details, reminders, and monthly average reflect the saved status.

### US-07 — Check upcoming deadlines

As a user, I want one place to check upcoming deadlines so that I can decide what needs attention.

- [ ] The dashboard follows the 30-day window, ordering, and event rules in Section 3.
- [ ] Deadlines within seven days have a clear urgency label.
- [ ] Past deadlines and returned or cancelled records are excluded.
- [ ] Deadline counts match the displayed events, with no duplicated renewals.
- [ ] Each event opens the relevant record.
- [ ] Average monthly subscription cost is correctly labeled and calculated.
- [ ] When there are no upcoming deadlines, an empty state provides a next action.

## 5. Screens and user flows

| Screen | Main content and actions |
| --- | --- |
| Sign in / Register | Account forms, validation, and sign-out access after authentication. |
| Dashboard | Upcoming deadlines, urgency labels, deadline count, average monthly subscription cost, and links to records. |
| Items | Item list, Add item action, active/returned status, and access to details. |
| Item details | Purchase information, deadlines, and edit, delete, return, or undo-return actions. |
| Add / Edit item | The five fields in US-02, field errors, Save item, and Cancel. |
| Subscriptions | Subscription list and details, add/edit forms, amounts, billing cycles, next billing dates, and cancellation/reactivation actions. |

Main flows:

1. **Add a purchase:** open Items, choose Add item, fill the form, correct any errors, save, and see the item and eligible reminders.
2. **Update a record:** open its details, edit or change its status, save, and see all affected views update.
3. **Track subscriptions:** enter the service and billing information, check the next charge and monthly average, and cancel or reactivate as needed.
4. **Act on a reminder:** open the Dashboard, select a deadline, and manage the associated record.

Use English throughout the interface. Keep navigation, typography, spacing, and form controls consistent. Inputs need visible labels, keyboard access, and focus states. Small screens should remain usable without clipped content. A save in progress must prevent duplicate submissions; a failed save must retain the draft and offer a retry.

### Dashboard presentation

Keep the dashboard calm and easy to scan. Use an off-white background, white surfaces, dark readable text, and a restrained deep-green accent. Use generous spacing, subtle borders, and light shadows rather than heavy outlines or bright colors.

Place the Dashboard heading and the Add item / Add subscription actions at the top. Show only two summary cards: upcoming deadlines in the next 30 days, and Average monthly subscription cost. Below them, use one clean deadline list with optional Within 7 days / In 8–30 days sections. Give each row a clear record name, a small event-type label, the deadline, and an urgency label. Reserve stronger color for urgent events.

Keep demo-only controls in a small collapsed Prototype tools area. Remove the visible Demo today date line from all views. A discreet Prototype badge may identify the mockup; record deadlines and relative urgency labels remain visible.

## 6. Technical constraints

The planned stack is Next.js with TypeScript and TailwindCSS, Next.js API routes, PostgreSQL, and JWT authentication.

The website must enforce ownership and validate data on the server as well as in forms. Keep secrets on the server and out of the repository. Provide documented API endpoints using OpenAPI/Swagger.

The P2 implementation includes unit, integration, and end-to-end tests, with the required TDD history and CI/CD workflow. Exact dependency versions, directory conventions, commands, and development workflow belong in the shared project rules file.

## 7. UI design reference

Prototype URL:

https://claude.ai/artifact/CPRyvxx7bDpjMWau2JmddM?sk=1KRqQph1BLUcx5C4NxUw-g

Use this prototype as the visual reference for the Dashboard, Items, and Subscriptions pages. The business rules and acceptance criteria in this PRD define the expected behavior when the prototype does not show every state or interaction.
