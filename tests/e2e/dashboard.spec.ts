import { expect, test, type Page } from "@playwright/test";
import { formatDateOnly, todayInTimeZone } from "../../src/lib/dates";
import { registerAndSignIn } from "./support/accounts";

// The dashboard (issue #9) against the real site: the 30-day window, groups, counts, the average
// monthly cost, links to records, and updates after a return or a cancellation. Every test starts
// with a new account. Dates are relative to today in New York, the browser's time zone here.
const TIME_ZONE = "America/New_York";
test.use({ timezoneId: TIME_ZONE });

/** Today in New York plus a number of days, as YYYY-MM-DD. */
function day(offset: number): string {
  const [year, month, date] = todayInTimeZone(TIME_ZONE, new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

async function addItem(page: Page, name: string, returnDeadline: string) {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill(name);
  await page.getByLabel(/^Purchase date/).fill(day(-10));
  await page.getByLabel(/^Return deadline/).fill(returnDeadline);
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(/\/items\/[0-9a-f-]{36}$/);
}

async function addSubscription(page: Page, name: string, amount: string, firstBillingDate: string) {
  await page.goto("/subscriptions/new");
  await page.getByLabel(/^Service name/).fill(name);
  await page.getByLabel(/^Amount/).fill(amount);
  await page.getByLabel(/^First billing date/).fill(firstBillingDate);
  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page).toHaveURL(/\/subscriptions\/[0-9a-f-]{36}$/);
}

async function openDashboard(page: Page) {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

function summary(page: Page, term: string) {
  return page.locator("dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");
}

function group(page: Page, name: RegExp) {
  return page.getByRole("list", { name });
}

test.beforeEach(async ({ page }) => {
  await registerAndSignIn(page, "dashboard");
});

test("a new account sees an empty dashboard with both add actions", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No deadlines in the next 30 days" })).toBeVisible();
  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("0");
  await expect(summary(page, "Average monthly subscription cost")).toContainText("$0.00");
  await expect(page.getByText("Demo today")).toHaveCount(0);

  await page.getByRole("link", { name: "Add subscription" }).last().click();
  await expect(page).toHaveURL(/\/subscriptions\/new$/);
  await page.goBack();
  await page.getByRole("link", { name: "Add item" }).last().click();
  await expect(page).toHaveURL(/\/items\/new$/);
});

test("deadlines from today through day 30 appear once, in order and in their groups", async ({ page }) => {
  await addItem(page, "Due today", day(0));
  await addItem(page, "Day 7", day(7));
  await addItem(page, "Day 8", day(8));
  await addItem(page, "Day 30", day(30));
  await addItem(page, "Day 31", day(31));
  await addItem(page, "Returned", day(1));
  await page.getByRole("button", { name: "Mark as returned" }).click();
  await expect(page.getByRole("button", { name: "Undo return" })).toBeVisible();
  await addSubscription(page, "Music", "9.99", day(12));
  await addSubscription(page, "Gym", "50", day(2));
  await page.getByRole("button", { name: "Cancel subscription" }).click();
  await expect(page.getByRole("button", { name: "Reactivate subscription" })).toBeVisible();

  await openDashboard(page);

  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("52 within 7 days.");
  await expect(summary(page, "Average monthly subscription cost")).toContainText("$9.99");
  await expect(group(page, /^Within 7 days/).getByRole("link")).toHaveText([
    `Due todayReturn deadline${formatDateOnly(day(0))}Due today`,
    `Day 7Return deadline${formatDateOnly(day(7))}In 7 days`,
  ]);
  await expect(group(page, /^In 8–30 days/).getByRole("link")).toHaveText([
    `Day 8Return deadline${formatDateOnly(day(8))}In 8 days`,
    `MusicRenewal$9.99 per month${formatDateOnly(day(12))}In 12 days`,
    `Day 30Return deadline${formatDateOnly(day(30))}In 30 days`,
  ]);
  await expect(page.getByText("Day 31")).toHaveCount(0);
  await expect(page.getByText("Returned", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Gym")).toHaveCount(0);

  await page.getByRole("link", { name: /^Day 7/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Day 7" })).toBeVisible();
  await openDashboard(page);
  await page.getByRole("link", { name: /^Music/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Music" })).toBeVisible();
});

test("returning an item and cancelling a subscription update the events, count, and average", async ({ page }) => {
  await addItem(page, "Wool coat", day(3));
  await addSubscription(page, "Music", "9.99", day(5));

  await openDashboard(page);
  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("2");
  await page.getByRole("link", { name: /^Wool coat/ }).click();
  await page.getByRole("button", { name: "Mark as returned" }).click();
  await expect(page.getByRole("button", { name: "Undo return" })).toBeVisible();

  await openDashboard(page);
  await expect(page.getByRole("link", { name: /^Wool coat/ })).toHaveCount(0);
  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("11 within 7 days.");
  await page.getByRole("link", { name: /^Music/ }).click();
  await page.getByRole("button", { name: "Cancel subscription" }).click();
  await expect(page.getByRole("button", { name: "Reactivate subscription" })).toBeVisible();

  await openDashboard(page);
  await expect(page.getByRole("heading", { name: "No deadlines in the next 30 days" })).toBeVisible();
  await expect(summary(page, "Average monthly subscription cost")).toContainText("$0.00");

  await page.goto("/subscriptions");
  await page.getByRole("link", { name: "Music" }).click();
  await page.getByRole("button", { name: "Reactivate subscription" }).click();
  await expect(page.getByRole("button", { name: "Cancel subscription" })).toBeVisible();
  await page.goto("/items");
  await page.getByRole("link", { name: "Wool coat" }).click();
  await page.getByRole("button", { name: "Undo return" }).click();
  await expect(page.getByRole("button", { name: "Mark as returned" })).toBeVisible();

  await openDashboard(page);
  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("22 within 7 days.");
  await expect(summary(page, "Average monthly subscription cost")).toContainText("$9.99");
});

test("an event opens with the keyboard alone", async ({ page }) => {
  await addItem(page, "Wool coat", day(3));
  await openDashboard(page);

  const event = page.getByRole("link", { name: /^Wool coat/ });
  await event.focus();
  await expect(event).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { level: 1, name: "Wool coat" })).toBeVisible();
});

test("the dashboard fits a phone screen without sideways scrolling", async ({ page }) => {
  await addItem(page, "Noise-cancelling headphones with a long name", day(3));
  await addSubscription(page, "Streaming service with a long name", "15.49", day(10));
  await page.setViewportSize({ width: 375, height: 800 });
  await openDashboard(page);

  await expect(page.getByRole("link", { name: /^Noise-cancelling/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("link", { name: "Add subscription" }).first()).toBeInViewport();
});
