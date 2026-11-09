import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/server-session";
import { getPool } from "@/lib/db/pool";
import { findSubscription } from "./subscription-repository";

/**
 * The signed-in user's subscription for a page, or null (issue #7). A page's title and body both need
 * it; cache() reads it once per request. Another user's subscription is null too.
 */
export const loadSubscription = cache(async (id: string) => {
  const user = await getCurrentUser();
  return user ? findSubscription(getPool(), user.id, id) : null;
});
