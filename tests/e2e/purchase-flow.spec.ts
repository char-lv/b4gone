import { expect, test } from "@playwright/test";
import { formatDateOnly, todayInTimeZone } from "../../src/lib/dates";
import { E2E_PASSWORD, registerAndSignIn } from "./support/accounts";

// One purchase from start to finish (issue #6): sign in, add with a failed save first, view, edit,
// return, undo, and delete. The other specs check each step on its own.
const TIME_ZONE = "America/New_York";
test.use({ timezoneId: TIME_ZONE });

/** Today in New York plus a number of days, as YYYY-MM-DD. */
function day(offset: number): string {
  const [year, month, date] = todayInTimeZone(TIME_ZONE, new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

test("a signed-in user adds, views, edits, returns, restores, and deletes a purchase", async ({ page }) => {
  const email = await registerAndSignIn(page, "purchase-flow");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  // Sign in.
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  // Add, fixing a field error and surviving a failed save.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Items" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();
  await page.getByRole("link", { name: "Add item" }).click();
  await page.getByLabel(/^Purchase date/).fill(day(-10));
  await page.getByLabel(/^Price/).fill("1,,2");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Fix 2 fields to save this item.")).toBeVisible();

  await page.getByLabel(/^Name/).fill("Wool coat");
  await page.getByLabel(/^Price/).fill("189.50");
  await page.getByLabel(/^Return deadline/).fill(day(5));
  await page.route("**/api/items", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":{"code":"server_error","message":"x"}}' }),
  );
  await page.getByRole("button", { name: "Save item" }).click();
  // Next.js adds its own route announcer with role="alert", so look inside the page content.
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Couldn’t save this item.");
  await expect(page.getByLabel(/^Name/)).toHaveValue("Wool coat");
  await page.unroute("**/api/items");
  await page.getByRole("button", { name: "Save item" }).click();

  // View.
  await expect(page.getByRole("heading", { level: 1, name: "Wool coat" })).toBeVisible();
  await expect(page.getByRole("region", { name: "On the dashboard" }).getByRole("listitem")).toHaveText([
    `Return deadline: ${formatDateOnly(day(5))} (In 5 days)`,
  ]);
  await page.getByRole("link", { name: "Back to items" }).click();
  await expect(page.getByText("1 item: 1 active, 0 returned. Newest purchases first.")).toBeVisible();
  await page.getByRole("link", { name: "Wool coat" }).click();

  // Edit.
  await page.getByRole("link", { name: "Edit item" }).click();
  await page.getByLabel(/^Price/).fill("0");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Item saved." })).toBeVisible();
  await expect(page.getByText("$0.00")).toBeVisible();

  // Return, then undo.
  await page.getByRole("button", { name: "Mark as returned" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 deadline removed from the dashboard." })).toBeVisible();
  await page.getByRole("link", { name: "Back to items" }).click();
  await expect(page.getByText("1 item: 0 active, 1 returned. Newest purchases first.")).toBeVisible();
  await page.getByRole("link", { name: "Wool coat" }).click();
  await page.getByRole("button", { name: "Undo return" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 deadline back on the dashboard." })).toBeVisible();

  // Delete, after keeping it once.
  await page.getByRole("button", { name: "Delete item" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete “Wool coat”?" });
  await dialog.getByRole("button", { name: "Keep item" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Wool coat" })).toBeVisible();
  await page.getByRole("button", { name: "Delete item" }).click();
  await dialog.getByRole("button", { name: "Delete item" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Item deleted." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();
});
