import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { findItem } from "./item-repository";

/**
 * The signed-in user's item for a page, or null. A page's title and body both need it; cache()
 * reads it once per request. Another user's item is null too, so pages reveal nothing about it.
 */
export const loadItem = cache(async (id: string) => {
  const user = await getCurrentUser();
  return user ? findItem(getPool(), user.id, id) : null;
});
