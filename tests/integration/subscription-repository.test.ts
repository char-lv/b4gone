import {
  createSubscription,
  deleteSubscription,
  findSubscription,
  listSubscriptions,
  setSubscriptionStatus,
  updateSubscription,
} from "@/features/subscriptions/subscription-repository";
import type { NewSubscriptionInput } from "@/features/subscriptions/subscription-schema";
import { averageMonthlyCostCents, nextRenewals } from "@/features/subscriptions/subscription-calculations";
import { getPool } from "@/lib/db/pool";

// Subscription persistence and ownership against the test database (issue #7). It deletes only the
// @subscriptions-test.example accounts it creates; their subscriptions go with them.
const DOMAIN = "subscriptions-test.example";

const MUSIC: NewSubscriptionInput = {
  name: "Music plan",
  amountCents: 1099,
  billingCycle: "monthly",
  firstBillingDate: "2026-01-31",
};

async function createOwner(name: string): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    "insert into users (email, password_hash) values ($1, 'not-a-real-hash') returning id",
    [`${name}@${DOMAIN}`],
  );
  return result.rows[0].id;
}

async function removeOwners(): Promise<void> {
  await getPool().query("delete from users where email like $1", [`%@${DOMAIN}`]);
}

/** Moves a subscription's updated_at into the past so a later change is visible. */
async function ageSubscription(id: string): Promise<Date> {
  const result = await getPool().query<{ updatedAt: Date }>(
    `update subscriptions set updated_at = '2026-01-01T00:00:00Z' where id = $1 returning updated_at as "updatedAt"`,
    [id],
  );
  return result.rows[0].updatedAt;
}

async function updatedAt(id: string): Promise<Date> {
  const result = await getPool().query<{ updatedAt: Date }>(
    `select updated_at as "updatedAt" from subscriptions where id = $1`,
    [id],
  );
  return result.rows[0].updatedAt;
}

beforeEach(removeOwners);
afterAll(removeOwners);

describe("createSubscription", () => {
  it("stores one active subscription for the owner and returns it with camelCase fields", async () => {
    const ownerId = await createOwner("jane");

    const subscription = await createSubscription(getPool(), ownerId, MUSIC);

    expect(subscription).toEqual({ id: expect.any(String), ...MUSIC, status: "active" });
    const stored = await getPool().query("select owner_id, amount_cents, billing_cycle from subscriptions where id = $1", [
      subscription.id,
    ]);
    expect(stored.rows).toEqual([{ owner_id: ownerId, amount_cents: 1099, billing_cycle: "monthly" }]);
  });

  it("stores a free plan and a yearly plan whose first charge is in the future", async () => {
    const ownerId = await createOwner("jane");

    const free = await createSubscription(getPool(), ownerId, { ...MUSIC, name: "Free tier", amountCents: 0 });
    const yearly = await createSubscription(getPool(), ownerId, {
      name: "Cloud storage",
      amountCents: 9999,
      billingCycle: "yearly",
      firstBillingDate: "2099-02-28",
    });

    expect(free.amountCents).toBe(0);
    expect(yearly).toMatchObject({ billingCycle: "yearly", firstBillingDate: "2099-02-28", status: "active" });
  });
});

describe("date-only values", () => {
  // pg would parse DATE columns into JavaScript Dates at local midnight. The anchor must come back as
  // the exact YYYY-MM-DD saved, or a Jan 31 anchor could turn into Jan 30 and change every renewal.
  it("come back as the saved anchor whatever the session time zone and date style", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createSubscription(getPool(), ownerId, { ...MUSIC, firstBillingDate: "2024-02-29" });

    const client = await getPool().connect();
    try {
      await client.query("set time zone 'Pacific/Kiritimati'");
      await client.query("set datestyle to 'SQL, DMY'");
      const [listed] = await listSubscriptions(client, ownerId);
      expect(listed.firstBillingDate).toBe("2024-02-29");
      expect(await findSubscription(client, ownerId, saved.id)).toEqual(listed);
    } finally {
      await client.query("reset time zone");
      await client.query("reset datestyle");
      client.release();
    }
  });
});

describe("listSubscriptions", () => {
  it("returns an empty list for an owner without subscriptions", async () => {
    expect(await listSubscriptions(getPool(), await createOwner("jane"))).toEqual([]);
  });

  it("lists by name, ignoring case, and keeps equal names in the order they were added", async () => {
    const ownerId = await createOwner("jane");
    const second = await createSubscription(getPool(), ownerId, { ...MUSIC, name: "news" });
    await createSubscription(getPool(), ownerId, { ...MUSIC, name: "Video" });
    await createSubscription(getPool(), ownerId, { ...MUSIC, name: "Backup" });
    const third = await createSubscription(getPool(), ownerId, { ...MUSIC, name: "news" });

    const names = (await listSubscriptions(getPool(), ownerId)).map((subscription) => [subscription.name, subscription.id]);

    expect(names).toEqual([
      ["Backup", expect.any(String)],
      ["news", second.id],
      ["news", third.id],
      ["Video", expect.any(String)],
    ]);
  });

  it("gives #8's calculations the fields they need without any mapping", async () => {
    const ownerId = await createOwner("jane");
    const monthly = await createSubscription(getPool(), ownerId, MUSIC);
    const yearly = await createSubscription(getPool(), ownerId, {
      name: "Cloud storage",
      amountCents: 1200,
      billingCycle: "yearly",
      firstBillingDate: "2024-02-29",
    });
    const cancelled = await createSubscription(getPool(), ownerId, { ...MUSIC, name: "Old plan", amountCents: 5000 });
    await setSubscriptionStatus(getPool(), ownerId, cancelled.id, "cancelled");

    const saved = await listSubscriptions(getPool(), ownerId);

    expect(averageMonthlyCostCents(saved)).toBe(1099 + 100);
    expect(nextRenewals(saved, "2026-02-01")).toEqual([
      { subscriptionId: yearly.id, name: "Cloud storage", date: "2026-02-28", amountCents: 1200 },
      { subscriptionId: monthly.id, name: "Music plan", date: "2026-02-28", amountCents: 1099 },
    ]);
  });
});

describe("updateSubscription", () => {
  it("replaces every field, keeps the status, and marks the row updated", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createSubscription(getPool(), ownerId, MUSIC);
    await setSubscriptionStatus(getPool(), ownerId, saved.id, "cancelled");
    const before = await ageSubscription(saved.id);
    const changes: NewSubscriptionInput = {
      name: "Family music plan",
      amountCents: 1699,
      billingCycle: "yearly",
      firstBillingDate: "2027-03-15",
    };

    const updated = await updateSubscription(getPool(), ownerId, saved.id, changes);

    expect(updated).toEqual({ id: saved.id, ...changes, status: "cancelled" });
    expect(await findSubscription(getPool(), ownerId, saved.id)).toEqual(updated);
    expect((await updatedAt(saved.id)).getTime()).toBeGreaterThan(before.getTime());
  });

  it("returns null for a missing or malformed id", async () => {
    const ownerId = await createOwner("jane");
    expect(await updateSubscription(getPool(), ownerId, "00000000-0000-4000-8000-000000000000", MUSIC)).toBeNull();
    expect(await updateSubscription(getPool(), ownerId, "not-a-uuid", MUSIC)).toBeNull();
  });
});

describe("setSubscriptionStatus", () => {
  it("cancels and reactivates without moving the billing anchor or any other field", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createSubscription(getPool(), ownerId, MUSIC);

    const cancelled = await setSubscriptionStatus(getPool(), ownerId, saved.id, "cancelled");
    const reactivated = await setSubscriptionStatus(getPool(), ownerId, saved.id, "active");

    expect(cancelled).toEqual({ ...saved, status: "cancelled" });
    expect(reactivated).toEqual(saved);
    // Reactivating recalculates from the original Jan 31 anchor: Feb 28, then Mar 31, never Mar 28.
    expect(nextRenewals([reactivated!], "2026-03-01")[0].date).toBe("2026-03-31");
  });

  it("updates updated_at only when the status really changes", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createSubscription(getPool(), ownerId, MUSIC);
    const before = await ageSubscription(saved.id);

    await setSubscriptionStatus(getPool(), ownerId, saved.id, "active");
    expect((await updatedAt(saved.id)).getTime()).toBe(before.getTime());

    await setSubscriptionStatus(getPool(), ownerId, saved.id, "cancelled");
    expect((await updatedAt(saved.id)).getTime()).toBeGreaterThan(before.getTime());
  });
});

describe("deleteSubscription", () => {
  it("removes the subscription and reports whether anything was deleted", async () => {
    const ownerId = await createOwner("jane");
    const saved = await createSubscription(getPool(), ownerId, MUSIC);

    expect(await deleteSubscription(getPool(), ownerId, saved.id)).toBe(true);
    expect(await findSubscription(getPool(), ownerId, saved.id)).toBeNull();
    expect(await deleteSubscription(getPool(), ownerId, saved.id)).toBe(false);
    expect(await deleteSubscription(getPool(), ownerId, "not-a-uuid")).toBe(false);
  });
});

describe("ownership", () => {
  it("never lists, finds, edits, cancels, reactivates, or deletes another owner's subscription", async () => {
    const janeId = await createOwner("jane");
    const samId = await createOwner("sam");
    const janes = await createSubscription(getPool(), janeId, MUSIC);
    await setSubscriptionStatus(getPool(), janeId, janes.id, "cancelled");
    const samsOwn = await createSubscription(getPool(), samId, { ...MUSIC, name: "Sam's plan" });

    expect(await listSubscriptions(getPool(), samId)).toEqual([samsOwn]);
    expect(await findSubscription(getPool(), samId, janes.id)).toBeNull();
    expect(await updateSubscription(getPool(), samId, janes.id, { ...MUSIC, name: "Taken over" })).toBeNull();
    expect(await setSubscriptionStatus(getPool(), samId, janes.id, "active")).toBeNull();
    expect(await deleteSubscription(getPool(), samId, janes.id)).toBe(false);

    expect(await findSubscription(getPool(), janeId, janes.id)).toEqual({ ...janes, status: "cancelled" });
  });
});
