-- Purchases with return and warranty deadlines (issue #4). Each item belongs to one account and is
-- deleted with it. The checks repeat the shared item validation so an application bug cannot store
-- an impossible record; prices stop at 99999999 cents to match MAX_AMOUNT_CENTS.
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  name text not null,
  purchase_date date not null,
  price_cents integer,
  return_deadline date,
  warranty_expiration date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_name_length check (char_length(name) between 1 and 100),
  constraint items_price_range check (price_cents between 0 and 99999999),
  constraint items_return_after_purchase check (return_deadline >= purchase_date),
  constraint items_warranty_after_purchase check (warranty_expiration >= purchase_date),
  constraint items_status check (status in ('active', 'returned'))
);

-- Every query filters by owner; the list shows the newest purchases first.
create index items_owner_purchase_idx on items (owner_id, purchase_date desc);
