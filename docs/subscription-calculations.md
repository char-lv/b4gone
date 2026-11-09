# Subscription calculations

Issue #8 adds one tested calculation layer for renewal dates and subscription spending. Subscription storage and forms (#7) and the dashboard (#9) call these functions instead of computing dates or totals themselves. The rules come from [PRD Section 3](PRD.md#3-data-and-business-rules).

All functions are pure. They take `today` as an argument and never read the clock, so callers decide what "today" is:

- On the server, derive it from the user's time zone with `todayInTimeZone(timeZone, new Date())` from `src/lib/dates.ts`.
- In the browser, read it again at each render or submission so an open page follows local midnight (the add-item page in #3 shows the pattern).

Dates are `YYYY-MM-DD` strings (PostgreSQL `DATE`). Amounts are integer cents.

## `nextBillingDate(firstBillingDate, cycle, today)`

`src/lib/recurrence.ts`. `cycle` is `"monthly"` or `"yearly"`. Returns the first billing occurrence on or after `today`, as `YYYY-MM-DD`.

| Rule | Example |
| --- | --- |
| A charge due today is the next charge | Anchor Oct 5, today Nov 5 → Nov 5 |
| A future first billing date is the next charge | Anchor Dec 15, 2026, today Nov 5, 2026 → Dec 15, 2026 |
| Monthly keeps the anchor day and clamps only short months | Jan 31 anchor → Feb 28 (Feb 29 in leap years), then Mar 31, Apr 30, May 31 |
| A clamped date is never the next anchor | Jan 30 anchor → Feb 28, then Mar 30 |
| Yearly Feb 29 follows the leap-year rule | Feb 29, 2024 anchor → Feb 28, 2026 and 2027; Feb 29, 2028; Feb 28, 2100; Feb 29, 2400 |
| Malformed or impossible dates throw | `"2026-02-30"`, `"2026-1-15"`, `""` → `RangeError` |

Validate input before calling it (#7's schema); the `RangeError` is a programming error, not a user-facing message.

## `nextRenewals(subscriptions, today)`

`src/features/subscriptions/subscription-calculations.ts`. Returns one `RenewalEvent` per **active** subscription, in input order:

```ts
type RenewalEvent = { subscriptionId: string; name: string; date: string; amountCents: number };
```

- Cancelled subscriptions give no event.
- A reactivated subscription is just active again: its date comes from the original `firstBillingDate`.
- A free (zero-amount) subscription still has a renewal.
- The result is not limited to the 30-day dashboard window and is not sorted. #9 keeps events from `today` through day 30 inclusive, merges them with item events, and sorts by date, event type, and record name.

## `averageMonthlyCostCents(subscriptions)`

Same module. Returns active monthly amounts plus one twelfth of active yearly amounts, as integer cents.

- Cancelled subscriptions add nothing.
- The sum is kept exactly (in twelfths of a cent) and rounded once at the end with `Math.round`, so half a cent rounds up. Three $1.00 yearly plans average 25 cents, not 3 × 8.
- Format the result for display with `formatUsd` from `src/lib/money.ts`. Do not round or re-add per-subscription shares anywhere else.

## Input shape

Both list functions take `BillableSubscription` values:

```ts
type BillableSubscription = {
  id: string;
  name: string;
  amountCents: number; // nonnegative integer
  billingCycle: "monthly" | "yearly";
  firstBillingDate: string; // YYYY-MM-DD, the recurring anchor
  status: "active" | "cancelled";
};
```

#7 maps its database rows (`amount_cents`, `billing_cycle`, `first_billing_date`, `status`) to these camelCase fields at the server boundary. `amountCents × 12` must stay a safe integer, so #7's validation should cap amounts well below `Number.MAX_SAFE_INTEGER / 12` cents.

## Saved subscriptions and the dashboard handoff (#7 → #9)

Issue #7 stores subscriptions and calls the functions above; it never computes a date or a total itself. This is what the dashboard (#9) can rely on.

### Reading the data

- Table `subscriptions` (`db/migrations/003_create_subscriptions.sql`): `owner_id`, `name`, `amount_cents` (integer, 0–99999999), `billing_cycle` (`monthly`/`yearly`), `first_billing_date` (`DATE`, the anchor; may be in the future), `status` (`active`/`cancelled`, default `active`). The next charge is never stored.
- On the server, `listSubscriptions(db, ownerId)` in `src/features/subscriptions/subscription-repository.ts` returns the owner's rows as `Subscription` values, ordered by name. A `Subscription` is a `BillableSubscription`, so pass the list straight to `nextRenewals(list, today)` and `averageMonthlyCostCents(list)` without mapping or filtering. Always take the owner from the verified session (`getCurrentUser()` in a Server Component).
- Over HTTP, `GET /api/subscriptions?timeZone=<IANA zone>` returns `{ subscriptions, averageMonthlyCostCents }`, where each subscription carries `nextBillingDate` (`null` while cancelled). See `docs/api/openapi.yaml`.

### Today and time zones

The server does not know the user's time zone. The Subscriptions pages compute the next charge in the browser with `NextCharge` (`src/features/subscriptions/NextCharge.tsx`), which reads the local date through `useLocalToday()` and follows the clock past midnight. The dashboard should do the same: load the rows on the server, then compute `nextRenewals(rows, today)` and the 0–30 day window in a client component that uses `useLocalToday()`, or call the API with the browser's `timeZone`. `averageMonthlyCostCents` does not depend on today.

### Links and refreshes

- Each renewal event opens `/subscriptions/{subscriptionId}`. Another user's id, a missing one, and a malformed one all show "Subscription not found" with a real 404.
- Every subscription change (add, edit, cancel, reactivate, delete) awaits the API and then calls `router.refresh()`, which drops the client router cache. A dashboard rendered as a dynamic Server Component (it reads the session cookie) therefore shows the saved state on the next visit without extra wiring. A dashboard that keeps client state of its own must reload it after these changes.
- A cancelled subscription contributes no renewal event and no cost; reactivating it brings both back from the original anchor. A free (`0`) active subscription still has a renewal event.
