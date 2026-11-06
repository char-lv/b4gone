import { expect, test, type Page } from "@playwright/test";
import { registerAndSignIn } from "./support/accounts";

// Saving and viewing items for the signed-in account (issue #4). Every test starts with a new
// account, so the list only shows what the test adds.
test.use({ timezoneId: "America/New_York" });

const ITEM_URL = /\/items\/[0-9a-f-]{36}$/;

async function addItem(page: Page, item: { name: string; purchaseDate: string; price?: string; returnDeadline?: string }) {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill(item.name);
  await page.getByLabel(/^Purchase date/).fill(item.purchaseDate);
  if (item.price !== undefined) await page.getByLabel(/^Price/).fill(item.price);
  if (item.returnDeadline) await page.getByLabel(/^Return deadline/).fill(item.returnDeadline);
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(ITEM_URL);
}

test.beforeEach(async ({ page }) => {
  await registerAndSignIn(page, "items-list");
});

test("a new account sees the empty state and can start adding from it", async ({ page }) => {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Items" }).click();

  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByRole("link", { name: "Items" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();

  await page.getByRole("link", { name: "Add item" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Add item" })).toBeVisible();
});

test("saved items appear in the list, newest purchases first, and open their details", async ({ page }) => {
  await addItem(page, { name: "Desk lamp", purchaseDate: "2026-09-30" });
  await addItem(page, { name: "Wool coat", purchaseDate: "2026-10-09", price: "189.50", returnDeadline: "2026-11-08" });

  await expect(page.getByRole("status")).toHaveText("Item saved.");
  await page.getByRole("link", { name: "Back to items" }).click();

  await expect(page.getByText("2 items: 2 active, 0 returned. Newest purchases first.")).toBeVisible();
  const rows = page.getByRole("table", { name: "Items" }).getByRole("row");
  await expect(rows.nth(1)).toContainText("Wool coat");
  await expect(rows.nth(1)).toContainText("$189.50");
  await expect(rows.nth(2)).toContainText("Desk lamp");
  await expect(rows.nth(2)).toContainText("Not entered");

  await page.getByRole("link", { name: "Desk lamp" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Desk lamp" })).toBeVisible();
  // Opening an item later does not repeat the save confirmation.
  await expect(page.getByRole("status")).toBeEmpty();
});

test("going back to the list after a save shows the new item", async ({ page }) => {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Items" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();
  await page.getByRole("link", { name: "Add item" }).click();
  await page.getByLabel(/^Name/).fill("Desk lamp");
  await page.getByLabel(/^Purchase date/).fill("2026-09-30");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Desk lamp" })).toBeVisible();

  // Back twice: details -> add form -> the list that was showing the empty state.
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByRole("link", { name: "Desk lamp" })).toBeVisible();
  await expect(page.getByText("No items yet")).toHaveCount(0);
});

test("reloading the details page does not confirm the save again", async ({ page }) => {
  await addItem(page, { name: "Desk lamp", purchaseDate: "2026-09-30" });
  await expect(page.getByRole("status")).toHaveText("Item saved.");
  await expect(page).toHaveURL(/\/items\/[0-9a-f-]{36}$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Desk lamp" })).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
});

test("a failed save keeps the draft, and trying again saves exactly one item", async ({ page }) => {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill("Wool coat");
  await page.getByLabel(/^Purchase date/).fill("2026-10-09");
  await page.getByLabel(/^Price/).fill("189.50");

  await page.route("**/api/items", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":{"code":"server_error","message":"x"}}' }),
  );
  await page.getByRole("button", { name: "Save item" }).click();

  // Next.js adds its own route announcer with role="alert", so look inside the page content.
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Couldn’t save this item. Your entries are still here.",
  );
  await expect(page.getByLabel(/^Name/)).toHaveValue("Wool coat");
  await expect(page.getByLabel(/^Price/)).toHaveValue("189.50");
  await expect(page).toHaveURL(/\/items\/new$/);

  await page.unroute("**/api/items");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(ITEM_URL);

  await page.goto("/items");
  await expect(page.getByText("1 item: 1 active, 0 returned. Newest purchases first.")).toBeVisible();
});

test("another account cannot open the item by its address", async ({ page }) => {
  await addItem(page, { name: "Wool coat", purchaseDate: "2026-10-09" });
  const address = new URL(page.url()).pathname;

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await registerAndSignIn(page, "items-other");

  const response = await page.goto(address);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Item not found" })).toBeVisible();
  await expect(page.getByText("Wool coat")).toHaveCount(0);

  await page.goto("/items");
  await expect(page.getByRole("heading", { level: 2, name: "No items yet" })).toBeVisible();
});

test("an item can be added and opened with the keyboard alone", async ({ page }) => {
  await page.goto("/items");
  await page.getByRole("link", { name: "Add item" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByLabel(/^Name/)).toBeVisible();
  await page.getByLabel(/^Name/).focus();
  await page.keyboard.type("Desk lamp");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/^Purchase date/)).toBeFocused();
  await page.getByLabel(/^Purchase date/).fill("2026-09-30");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(ITEM_URL);
  await page.getByRole("link", { name: "Back to items" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Desk lamp" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Desk lamp" })).toBeVisible();
});

test("the list fits a phone screen without sideways scrolling", async ({ page }) => {
  await addItem(page, { name: "Noise-cancelling headphones", purchaseDate: "2026-10-21", price: "299.99" });
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/items");

  await expect(page.getByRole("link", { name: "Noise-cancelling headphones" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("link", { name: "Add item" })).toBeInViewport();
});
