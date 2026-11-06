// Parameterized queries for the items table (issue #4).
import "server-only";
import type { Pool, PoolClient } from "pg";
import type { NewItemInput } from "./item-schema";

export type ItemStatus = "active" | "returned";

export type Item = NewItemInput & { id: string; status: ItemStatus };

type Db = Pool | PoolClient;

export async function createItem(_db: Db, _ownerId: string, _input: NewItemInput): Promise<Item> {
  throw new Error("Not implemented: createItem");
}

export async function listItems(_db: Db, _ownerId: string): Promise<Item[]> {
  throw new Error("Not implemented: listItems");
}

export async function findItem(_db: Db, _ownerId: string, _id: string): Promise<Item | null> {
  throw new Error("Not implemented: findItem");
}
