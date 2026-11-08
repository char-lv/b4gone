import { expect, test, type Page } from "@playwright/test";
import { formatDateOnly, todayInTimeZone } from "../../src/lib/dates";
import { registerAndSignIn } from "./support/accounts";

// Editing, returning, undoing, and deleting items (issue #5). Every test starts with a new account.
// The server checks dates against the real clock, so the dates here are relative to today in New York.
const TIME_ZONE = "America/New_York";
test.use({ timezoneId: TIME_ZONE });

const ITEM_URL = /\/items\/[0-9a-f-]{36}$/;

/** Today in New York plus a number of days, as YYYY-MM-DD. */
function day(offset: number): string {
  const [year, month, date] = todayInTimeZone(TIME_ZONE, new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

async function addItem(page: Page, item: { name: string; purchaseDate: string; returnDeadline?: string; warrantyExpiration?: string }) {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill(item.name);
  await page.getByLabel(/^Purchase date/).fill(item.purchaseDate);
  if (item.returnDeadline) await page.getByLabel(/^Return deadline/).fill(item.returnDeadline);
  if (item.warrantyExpiration) await page.getByLabel(/^Warranty expiration/).fill(item.warrantyExpiration);
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(ITEM_URL);
}

function dashboardSection(page: Page) {
  return page.getByRole("region", { name: "On the dashboard" });
}

function notice(page: Page, text: string) {
  return page.getByRole("status").filter({ hasText: text });
}

test.beforeEach(async ({ page }) => {
  await registerAndSignIn(page, "item-actions");
});

test("editing fixes a field error, saves, and updates the details and the list", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10), returnDeadline: day(20) });
  const detailsUrl = page.url();

  await page.getByRole("link", { name: "Edit item" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit item" })).toBeVisible();
  await expect(page).toHaveTitle("Edit Wool coat · B4Gone");
  await expect(page.getByLabel(/^Name/)).toHaveValue("Wool coat");
  await expect(page.getByLabel(/^Return deadline/)).toHaveValue(day(20));

  await page.getByLabel(/^Name/).fill("");
  await page.getByLabel(/^Price/).fill("0");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Enter a name.")).toBeVisible();
  await expect(page.getByLabel(/^Name/)).toBeFocused();

  await page.getByLabel(/^Name/).fill("Navy wool coat");
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page).toHaveURL(detailsUrl);
  await expect(notice(page, "Item saved.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Navy wool coat" })).toBeFocused();
  await expect(page.getByText("$0.00")).toBeVisible();

  await page.getByRole("link", { name: "Back to items" }).click();
  await expect(page.getByRole("link", { name: "Navy wool coat" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Wool coat", exact: true })).toHaveCount(0);
});

test("cancelling an edit keeps the saved values", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10) });
  await page.getByRole("link", { name: "Edit item" }).click();

  await page.getByLabel(/^Name/).fill("Something else");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page).toHaveURL(ITEM_URL);
  await expect(page.getByRole("heading", { level: 1, name: "Wool coat" })).toBeVisible();
});

test("returning removes the item's dashboard deadlines and undo brings back the ones still ahead", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10), returnDeadline: day(3), warrantyExpiration: day(40) });
  await expect(dashboardSection(page).getByRole("listitem")).toHaveText([
    `Return deadline: ${formatDateOnly(day(3))} (In 3 days)`,
  ]);

  const toggle = page.getByRole("button", { name: "Mark as returned" });
  await toggle.click();

  await expect(notice(page, "Marked “Wool coat” as returned. 1 deadline removed from the dashboard.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo return" })).toBeFocused();
  await expect(page.getByText("Status", { exact: true }).locator("xpath=following-sibling::dd[1]")).toHaveText("Returned");
  await expect(dashboardSection(page)).toContainText("Returned items don’t create dashboard deadlines.");

  await page.getByRole("link", { name: "Back to items" }).click();
  await expect(page.getByText("1 item: 0 active, 1 returned. Newest purchases first.")).toBeVisible();
  await page.getByRole("link", { name: "Wool coat" }).click();

  await page.getByRole("button", { name: "Undo return" }).click();
  await expect(notice(page, "“Wool coat” is active again. 1 deadline back on the dashboard.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as returned" })).toBeFocused();
  await expect(dashboardSection(page).getByRole("listitem")).toHaveCount(1);
});

test("deleting asks first, can be cancelled with Keep item or Esc, and then removes the item", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10), returnDeadline: day(0) });
  const detailsPath = new URL(page.url()).pathname;
  const deleteButton = page.getByRole("button", { name: "Delete item" });
  const dialog = page.getByRole("dialog", { name: "Delete “Wool coat”?" });

  await deleteButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("This removes the item and its 1 dashboard deadline.");
  await expect(dialog.getByRole("button", { name: "Keep item" })).toBeFocused();
  await dialog.getByRole("button", { name: "Keep item" }).click();
  await expect(dialog).toBeHidden();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Delete item" }).click();

  await expect(page).toHaveURL(/\/items$/);
  await expect(notice(page, "Item deleted.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Items" })).toBeFocused();
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();

  // Back does not bring the deleted item back from the router's cache.
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${detailsPath}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Item not found" })).toBeVisible();
});

test("failed changes show an error, change nothing, and work on retry", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10) });
  const serverError = { status: 500, contentType: "application/json", body: '{"error":{"code":"server_error","message":"x"}}' };

  await page.route("**/api/items/*/status", (route) => route.fulfill(serverError));
  await page.getByRole("button", { name: "Mark as returned" }).click();
  // Next.js adds its own route announcer with role="alert", so look inside the page content.
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Couldn’t mark this item as returned. Try again.");
  await page.unroute("**/api/items/*/status");
  await page.getByRole("button", { name: "Mark as returned" }).click();
  await expect(page.getByRole("button", { name: "Undo return" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

  await page.route("**/api/items/*", (route) =>
    route.request().method() === "DELETE" ? route.fulfill(serverError) : route.continue(),
  );
  await page.getByRole("button", { name: "Delete item" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete “Wool coat”?" });
  await dialog.getByRole("button", { name: "Delete item" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Couldn’t delete this item. Try again.");
  await expect(page).toHaveURL(ITEM_URL);

  await page.unroute("**/api/items/*");
  await dialog.getByRole("button", { name: "Delete item" }).click();
  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();
});

test("a failed edit keeps the changes in the form", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10) });
  await page.getByRole("link", { name: "Edit item" }).click();
  await page.getByLabel(/^Name/).fill("Navy wool coat");

  await page.route("**/api/items/*", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":{"code":"server_error","message":"x"}}' }),
  );
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toContainText("Couldn’t save this item.");
  await expect(page.getByLabel(/^Name/)).toHaveValue("Navy wool coat");
  await expect(page).toHaveURL(/\/edit$/);
});

test("the item actions and the delete dialog work with the keyboard alone", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10) });

  await page.getByRole("button", { name: "Mark as returned" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Undo return" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Delete item" })).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Delete “Wool coat”?" });
  await expect(dialog.getByRole("button", { name: "Keep item" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Delete item" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/items$/);
});

test("another account can neither edit the item nor open its edit page", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: day(-10) });
  const address = new URL(page.url()).pathname;

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await registerAndSignIn(page, "item-actions-other");

  const response = await page.goto(`${address}/edit`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Item not found" })).toBeVisible();
  await expect(page).toHaveTitle("Item not found · B4Gone");
});

test("the details actions and the dialog fit a phone screen", async ({ page }) => {
  await addItem(page, { name: "Noise-cancelling headphones with a long name", purchaseDate: day(-10), returnDeadline: day(5) });
  await page.setViewportSize({ width: 375, height: 740 });
  await page.reload();

  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await expect(page.getByRole("button", { name: "Delete item" })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Delete item" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Keep item" })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Delete item" })).toBeInViewport();
  expect(await overflow()).toBeLessThanOrEqual(0);
});
