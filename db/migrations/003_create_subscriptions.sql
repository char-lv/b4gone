-- Monthly and yearly subscriptions (issue #7). Each subscription belongs to one account and is
-- deleted with it. first_billing_date is the recurring anchor: the next charge is always derived
-- from it (src/lib/recurrence.ts, #8) and never stored, so cancelling and reactivating cannot move
-- it. The checks back up the shared subscription validation for the limits a database can state
-- simply: name length, a required amount from 0 to 99999999 cents (MAX_AMOUNT_CENTS, which keeps
-- amount x 12 a safe integer for the monthly average), the two cycles, and the two statuses. A first
-- billing date may be in the future, so there is no check against today. Trimming and the
-- visible-character and one-line name rules stay in validateNewSubscription.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  name text not null,
  amount_cents integer not null,
  billing_cycle text not null,
  first_billing_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_name_length check (char_length(name) between 1 and 100),
  constraint subscriptions_amount_range check (amount_cents between 0 and 99999999),
  constraint subscriptions_billing_cycle check (billing_cycle in ('monthly', 'yearly')),
  constraint subscriptions_status check (status in ('active', 'cancelled'))
);

-- Every query filters by owner; the list is ordered by name.
create index subscriptions_owner_name_idx on subscriptions (owner_id, lower(name));
