import { expect, test, type Page } from "@playwright/test";
import { formatDateOnly, todayInTimeZone } from "../../src/lib/dates";
import { nextBillingDate } from "../../src/lib/recurrence";
import { registerAndSignIn } from "./support/accounts";

// Subscriptions (issue #7): add, view, edit, cancel, reactivate, and delete, with field errors, a
// failed save, keyboard use, and a second account. Every test starts with a new account. Dates are
// relative to today in New York, the browser's time zone here, and next charges come from #8.
const TIME_ZONE = "America/New_York";
test.use({ timezoneId: TIME_ZONE });

const SUBSCRIPTION_URL = /\/subscriptions\/[0-9a-f-]{36}$/;

function today(): string {
  return todayInTimeZone(TIME_ZONE, new Date());
}

/** Today in New York plus a number of days, as YYYY-MM-DD. */
function day(offset: number): string {
  const [year, month, date] = today().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

type NewSubscription = { name: string; amount: string; firstBillingDate: string; yearly?: boolean };

async function addSubscription(page: Page, subscription: NewSubscription) {
  await page.goto("/subscriptions/new");
  await page.getByLabel(/^Service name/).fill(subscription.name);
  await page.getByLabel(/^Amount/).fill(subscription.amount);
  if (subscription.yearly) await page.getByRole("radio", { name: "Yearly" }).check();
  await page.getByLabel(/^First billing date/).fill(subscription.firstBillingDate);
  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page).toHaveURL(SUBSCRIPTION_URL);
}

function detail(page: Page, term: string) {
  return page.locator("dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");
}

function notice(page: Page, text: string) {
  return page.getByRole("status").filter({ hasText: text });
}

test.beforeEach(async ({ page }) => {
  await registerAndSignIn(page, "subscriptions");
});

test("adding a subscription fixes field errors with the keyboard, then shows it on the details page and the list", async ({ page }) => {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Subscriptions" }).click();
  await expect(page.getByRole("heading", { name: "No subscriptions yet" })).toBeVisible();
  await page.getByRole("link", { name: "Add subscription" }).click();
  await expect(page).toHaveTitle("Add subscription · B4Gone");

  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page.getByText("Fix 3 fields to save this subscription.")).toBeVisible();
  await expect(page.getByLabel(/^Service name/)).toBeFocused();

  // Keyboard only from here: type the name, tab to the amount, choose Yearly with the arrow keys.
  await page.keyboard.type("Cloud storage");
  await page.keyboard.press("Tab");
  await page.keyboard.type("12.5");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Monthly" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Yearly" })).toBeChecked();
  // A first billing date in the future is allowed: the plan starts later.
  await page.getByLabel(/^First billing date/).fill(day(40));
  await page.getByRole("button", { name: "Save subscription" }).press("Enter");

  await expect(page).toHaveURL(SUBSCRIPTION_URL);
  await expect(notice(page, "Subscription saved.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Cloud storage" })).toBeFocused();
  await expect(detail(page, "Amount")).toHaveText("$12.50");
  await expect(detail(page, "Billing cycle")).toHaveText("Yearly");
  await expect(detail(page, "Next charge")).toContainText(formatDateOnly(day(40)));
  await expect(detail(page, "Next charge")).toContainText("In 40 days");
  await expect(detail(page, "Status")).toHaveText("Active");

  await page.getByRole("link", { name: "Back to subscriptions" }).click();
  const row = page.getByRole("row", { name: /Cloud storage/ });
  await expect(row).toContainText("$12.50");
  await expect(row).toContainText("Yearly");
  await expect(row).toContainText(formatDateOnly(day(40)));
  await expect(page.getByText("Average monthly cost of active subscriptions: $1.04")).toBeVisible();
});

test("cancelling removes the next charge and the cost; reactivating restores them from the original anchor", async ({ page }) => {
  const anchor = day(-75);
  const expectedNext = nextBillingDate(anchor, "monthly", today());
  await addSubscription(page, { name: "Music plan", amount: "10", firstBillingDate: anchor });
  await expect(detail(page, "Next charge")).toContainText(formatDateOnly(expectedNext));

  await page.getByRole("button", { name: "Cancel subscription" }).click();
  await expect(notice(page, "Cancelled “Music plan”. Its renewal reminder and cost no longer count.")).toBeVisible();
  await expect(detail(page, "Status")).toHaveText("Cancelled");
  await expect(detail(page, "Next charge")).toHaveText("None while cancelled");
  await expect(page.getByRole("button", { name: "Reactivate subscription" })).toBeFocused();

  await page.getByRole("link", { name: "Back to subscriptions" }).click();
  await expect(page.getByRole("row", { name: /Music plan/ })).toContainText("Cancelled");
  await expect(page.getByText("Average monthly cost of active subscriptions: $0.00")).toBeVisible();

  await page.getByRole("link", { name: "Music plan" }).click();
  await page.getByRole("button", { name: "Reactivate subscription" }).click();
  await expect(notice(page, `“Music plan” is active again. Next charge: ${formatDateOnly(expectedNext)}.`)).toBeVisible();
  await expect(detail(page, "Status")).toHaveText("Active");
  await expect(detail(page, "First billing date")).toHaveText(formatDateOnly(anchor));

  await page.getByRole("link", { name: "Back to subscriptions" }).click();
  await expect(page.getByRole("row", { name: /Music plan/ })).toContainText("Active");
  await expect(page.getByText("Average monthly cost of active subscriptions: $10.00")).toBeVisible();
});

test("editing updates the details and the list, and deleting needs confirmation", async ({ page }) => {
  await addSubscription(page, { name: "Video plan", amount: "15.99", firstBillingDate: day(-10) });

  await page.getByRole("link", { name: "Edit subscription" }).click();
  await expect(page).toHaveTitle("Edit Video plan · B4Gone");
  await expect(page.getByLabel(/^Amount/)).toHaveValue("15.99");
  await page.getByLabel(/^Amount/).fill("17.999");
  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page.getByText("Use no more than two decimal places.")).toBeVisible();
  await page.getByLabel(/^Amount/).fill("17.99");
  await page.getByLabel(/^Service name/).fill("Video premium");
  await page.getByRole("button", { name: "Save subscription" }).click();

  await expect(notice(page, "Subscription saved.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Video premium" })).toBeVisible();
  await expect(detail(page, "Amount")).toHaveText("$17.99");

  // Esc closes the confirmation and keeps the subscription.
  await page.getByRole("button", { name: "Delete subscription" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete “Video premium”?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep subscription" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Delete subscription" })).toBeFocused();

  await page.getByRole("button", { name: "Delete subscription" }).click();
  await dialog.getByRole("button", { name: "Delete subscription" }).click();
  await expect(page).toHaveURL(/\/subscriptions$/);
  await expect(notice(page, "Subscription deleted.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No subscriptions yet" })).toBeVisible();
});

test("a failed save keeps the draft, and trying again saves it once", async ({ page }) => {
  await page.goto("/subscriptions/new");
  await page.getByLabel(/^Service name/).fill("News plan");
  await page.getByLabel(/^Amount/).fill("0");
  await page.getByLabel(/^First billing date/).fill(day(0));

  let attempts = 0;
  await page.route("**/api/subscriptions", async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    else await route.continue();
  });

  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Couldn’t save this subscription. Your entries are still here. Select “Save subscription” to try again.",
  );
  await expect(page.getByLabel(/^Service name/)).toHaveValue("News plan");

  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page).toHaveURL(SUBSCRIPTION_URL);
  // A free plan billed today: the charge due today is the next charge.
  await expect(detail(page, "Amount")).toHaveText("$0.00");
  await expect(detail(page, "Next charge")).toContainText("Due today");

  await page.getByRole("link", { name: "Back to subscriptions" }).click();
  await expect(page.getByRole("row", { name: /News plan/ })).toHaveCount(1);
});

test("another account sees none of the subscriptions and cannot open one", async ({ page, browser }) => {
  await addSubscription(page, { name: "Private plan", amount: "9.99", firstBillingDate: day(-5) });
  const privateUrl = page.url();

  const otherContext = await browser.newContext({ timezoneId: TIME_ZONE });
  const other = await otherContext.newPage();
  try {
    await registerAndSignIn(other, "subscriptions-other");
    await other.goto("/subscriptions");
    await expect(other.getByRole("heading", { name: "No subscriptions yet" })).toBeVisible();

    const response = await other.goto(privateUrl);
    expect(response?.status()).toBe(404);
    await expect(other.getByRole("heading", { level: 1, name: "Subscription not found" })).toBeVisible();
    await expect(other.getByText("Private plan")).toHaveCount(0);
  } finally {
    await otherContext.close();
  }
});
