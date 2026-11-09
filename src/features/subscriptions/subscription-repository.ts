// Parameterized queries for the subscriptions table (issue #7). Every query filters by the owner, and
// rows map from snake_case columns to the camelCase Subscription type here, at the server boundary.
// A Subscription is a BillableSubscription, so lists go straight into #8's calculations.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { isUuid } from "@/lib/uuid";
import type { SubscriptionStatus } from "./subscription-calculations";
import type { NewSubscriptionInput } from "./subscription-schema";

export type { SubscriptionStatus } from "./subscription-calculations";

export type Subscription = NewSubscriptionInput & { id: string; status: SubscriptionStatus };

type Db = Pool | PoolClient;

// to_char keeps the DATE anchor as YYYY-MM-DD text; pg would otherwise build a JavaScript Date at
// local midnight, and the session DateStyle would change a plain ::text cast.
const SUBSCRIPTION_COLUMNS = `id, name,
  amount_cents as "amountCents",
  billing_cycle as "billingCycle",
  to_char(first_billing_date, 'YYYY-MM-DD') as "firstBillingDate",
  status`;

export async function createSubscription(db: Db, ownerId: string, input: NewSubscriptionInput): Promise<Subscription> {
  const result = await db.query<Subscription>(
    `insert into subscriptions (owner_id, name, amount_cents, billing_cycle, first_billing_date)
     values ($1, $2, $3, $4, $5)
     returning ${SUBSCRIPTION_COLUMNS}`,
    [ownerId, input.name, input.amountCents, input.billingCycle, input.firstBillingDate],
  );
  return result.rows[0];
}

/** The owner's subscriptions by name, ignoring case; equal names keep the order they were added. */
export async function listSubscriptions(db: Db, ownerId: string): Promise<Subscription[]> {
  const result = await db.query<Subscription>(
    `select ${SUBSCRIPTION_COLUMNS} from subscriptions
     where owner_id = $1
     order by lower(name), name, created_at, id`,
    [ownerId],
  );
  return result.rows;
}

/** The subscription with this id if the owner has it; another owner's id looks the same as a missing one. */
export async function findSubscription(db: Db, ownerId: string, id: string): Promise<Subscription | null> {
  if (!isUuid(id)) return null;
  const result = await db.query<Subscription>(
    `select ${SUBSCRIPTION_COLUMNS} from subscriptions where id = $1 and owner_id = $2`,
    [id, ownerId],
  );
  return result.rows[0] ?? null;
}

/** Replaces every editable field of the owner's subscription; the status stays as it is. Null when not found. */
export async function updateSubscription(
  db: Db,
  ownerId: string,
  id: string,
  input: NewSubscriptionInput,
): Promise<Subscription | null> {
  if (!isUuid(id)) return null;
  const result = await db.query<Subscription>(
    `update subscriptions
     set name = $3, amount_cents = $4, billing_cycle = $5, first_billing_date = $6, updated_at = now()
     where id = $1 and owner_id = $2
     returning ${SUBSCRIPTION_COLUMNS}`,
    [id, ownerId, input.name, input.amountCents, input.billingCycle, input.firstBillingDate],
  );
  return result.rows[0] ?? null;
}

/**
 * Cancels or reactivates the owner's subscription; nothing else changes, so the billing anchor is
 * kept. Null when not found. Setting the status it already has does not move updated_at.
 */
export async function setSubscriptionStatus(
  db: Db,
  ownerId: string,
  id: string,
  status: SubscriptionStatus,
): Promise<Subscription | null> {
  if (!isUuid(id)) return null;
  const result = await db.query<Subscription>(
    `update subscriptions
     set status = $3, updated_at = case when status = $3 then updated_at else now() end
     where id = $1 and owner_id = $2
     returning ${SUBSCRIPTION_COLUMNS}`,
    [id, ownerId, status],
  );
  return result.rows[0] ?? null;
}

/** Deletes the owner's subscription; false when there was nothing to delete. */
export async function deleteSubscription(db: Db, ownerId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const result = await db.query(`delete from subscriptions where id = $1 and owner_id = $2 returning id`, [id, ownerId]);
  return result.rows.length > 0;
}
