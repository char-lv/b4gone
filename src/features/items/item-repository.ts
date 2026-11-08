// Parameterized queries for the items table (issue #4). Every query filters by the owner, and rows
// map from snake_case columns to the camelCase Item type here, at the server boundary.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { isUuid } from "@/lib/uuid";
import type { NewItemInput } from "./item-schema";

export type ItemStatus = "active" | "returned";

export type Item = NewItemInput & { id: string; status: ItemStatus };

type Db = Pool | PoolClient;

// to_char keeps DATE columns as YYYY-MM-DD text; pg would otherwise build JavaScript Dates at local
// midnight, and the session DateStyle would change a plain ::text cast.
const ITEM_COLUMNS = `id, name,
  to_char(purchase_date, 'YYYY-MM-DD') as "purchaseDate",
  price_cents as "priceCents",
  to_char(return_deadline, 'YYYY-MM-DD') as "returnDeadline",
  to_char(warranty_expiration, 'YYYY-MM-DD') as "warrantyExpiration",
  status`;

export async function createItem(db: Db, ownerId: string, input: NewItemInput): Promise<Item> {
  const result = await db.query<Item>(
    `insert into items (owner_id, name, purchase_date, price_cents, return_deadline, warranty_expiration)
     values ($1, $2, $3, $4, $5, $6)
     returning ${ITEM_COLUMNS}`,
    [ownerId, input.name, input.purchaseDate, input.priceCents, input.returnDeadline, input.warrantyExpiration],
  );
  return result.rows[0];
}

/** The owner's items, newest purchases first, then by name; equal entries keep the order added. */
export async function listItems(db: Db, ownerId: string): Promise<Item[]> {
  const result = await db.query<Item>(
    `select ${ITEM_COLUMNS} from items
     where owner_id = $1
     order by purchase_date desc, lower(name), name, created_at, id`,
    [ownerId],
  );
  return result.rows;
}

/** The item with this id if the owner has it; another owner's id looks the same as a missing one. */
export async function findItem(db: Db, ownerId: string, id: string): Promise<Item | null> {
  if (!isUuid(id)) return null;
  const result = await db.query<Item>(`select ${ITEM_COLUMNS} from items where id = $1 and owner_id = $2`, [
    id,
    ownerId,
  ]);
  return result.rows[0] ?? null;
}
