import { expect, test, type Page } from "@playwright/test";
import { todayInTimeZone } from "../../src/lib/dates";
import { registerAndSignIn } from "./support/accounts";

// Changes stay in step across the website (issue #10): edits and deletions reach the lists, details,
// dashboard events, and cost totals; dates cross the 30-day window and the 7-day boundary; an open
// dashboard follows local midnight; double clicks save once; forms fit a phone and show focus; and
// editing or deleting sends no failing requests. Dates are relative to today in New York.
const TIME_ZONE = "America/New_York";
test.use({ timezoneId: TIME_ZONE });

/** Today in New York plus a number of days, as YYYY-MM-DD. */
function day(offset: number): string {
  const [year, month, date] = todayInTimeZone(TIME_ZONE, new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

/** 23:59 today in New York, as an instant. */
function oneMinuteBeforeMidnight(): Date {
  const [year, month, date] = day(0).split("-").map(Number);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(new Date(Date.UTC(year, month - 1, date, 12)))
    .find((part) => part.type === "timeZoneName")!.value; // for example "GMT-05:00"
  const [, sign, hours, minutes] = /GMT([+-])(\d{2}):(\d{2})/.exec(offset)!;
  const offsetMs = (sign === "-" ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) * 60_000;
  return new Date(Date.UTC(year, month - 1, date, 23, 59) - offsetMs);
}

const ITEM_URL = /\/items\/[0-9a-f-]{36}$/;
const SUBSCRIPTION_URL = /\/subscriptions\/[0-9a-f-]{36}$/;

async function addItem(page: Page, name: string, dates: { returnDeadline?: string; warrantyExpiration?: string }) {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill(name);
  await page.getByLabel(/^Purchase date/).fill(day(-10));
  if (dates.returnDeadline) await page.getByLabel(/^Return deadline/).fill(dates.returnDeadline);
  if (dates.warrantyExpiration) await page.getByLabel(/^Warranty expiration/).fill(dates.warrantyExpiration);
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(ITEM_URL);
  return page.url();
}

async function editReturnDeadline(page: Page, itemUrl: string, returnDeadline: string) {
  await page.goto(itemUrl);
  await page.getByRole("link", { name: "Edit item" }).click();
  await page.getByLabel(/^Return deadline/).fill(returnDeadline);
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page).toHaveURL(ITEM_URL);
  await expect(page.getByText("Item saved.")).toBeVisible();
}

async function addSubscription(page: Page, name: string, amount: string, firstBillingDate: string) {
  await page.goto("/subscriptions/new");
  await page.getByLabel(/^Service name/).fill(name);
  await page.getByLabel(/^Amount/).fill(amount);
  await page.getByLabel(/^First billing date/).fill(firstBillingDate);
  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page).toHaveURL(SUBSCRIPTION_URL);
  return page.url();
}

async function editSubscription(page: Page, subscriptionUrl: string, fields: { amount?: string; firstBillingDate?: string }) {
  await page.goto(subscriptionUrl);
  await page.getByRole("link", { name: "Edit subscription" }).click();
  if (fields.amount) await page.getByLabel(/^Amount/).fill(fields.amount);
  if (fields.firstBillingDate) await page.getByLabel(/^First billing date/).fill(fields.firstBillingDate);
  await page.getByRole("button", { name: "Save subscription" }).click();
  await expect(page).toHaveURL(SUBSCRIPTION_URL);
}

async function openDashboard(page: Page) {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

function summary(page: Page, term: string) {
  return page.locator("dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");
}

function deadlineCount(page: Page) {
  return summary(page, "Deadlines in the next 30 days").locator("span").first();
}

function averageCost(page: Page) {
  return summary(page, "Average monthly subscription cost").locator("span").first();
}

const soonGroup = (page: Page) => page.getByRole("list", { name: /^Within 7 days/ });
const laterGroup = (page: Page) => page.getByRole("list", { name: /^In 8–30 days/ });

test.beforeEach(async ({ page }) => {
  await registerAndSignIn(page, "sync");
});

test("editing an item's date moves its event across the 30-day window and the 7-day boundary", async ({ page }) => {
  const coat = await addItem(page, "Wool coat", { returnDeadline: day(31) });
  await openDashboard(page);
  await expect(page.getByRole("heading", { name: "No deadlines in the next 30 days" })).toBeVisible();
  await expect(deadlineCount(page)).toHaveText("0");

  await editReturnDeadline(page, coat, day(25));
  await openDashboard(page);
  await expect(laterGroup(page).getByRole("link", { name: /^Wool coat/ })).toContainText("In 25 days");
  await expect(deadlineCount(page)).toHaveText("1");

  await editReturnDeadline(page, coat, day(8));
  await openDashboard(page);
  const dayEight = laterGroup(page).getByText("In 8 days");
  await expect(dayEight).toBeVisible();
  await expect(dayEight).not.toHaveClass(/text-urgent/);
  await expect(page.getByRole("list", { name: /^Within 7 days/ })).toHaveCount(0);

  await editReturnDeadline(page, coat, day(7));
  await openDashboard(page);
  const daySeven = soonGroup(page).getByText("In 7 days");
  await expect(daySeven).toBeVisible();
  await expect(daySeven).toHaveClass(/text-urgent/);
  await expect(summary(page, "Deadlines in the next 30 days")).toContainText("1 within 7 days.");
  await expect(page.getByRole("list", { name: /^In 8–30 days/ })).toHaveCount(0);

  await editReturnDeadline(page, coat, day(31));
  await openDashboard(page);
  await expect(page.getByRole("link", { name: /^Wool coat/ })).toHaveCount(0);
  await expect(deadlineCount(page)).toHaveText("0");
});

test("deleting an item removes both of its events from the dashboard", async ({ page }) => {
  await addItem(page, "Robot vacuum", { returnDeadline: day(3), warrantyExpiration: day(20) });
  await openDashboard(page);
  await expect(page.getByRole("link", { name: /^Robot vacuum/ })).toHaveCount(2);
  await expect(deadlineCount(page)).toHaveText("2");

  await page.getByRole("link", { name: /^Robot vacuum/ }).first().click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByText("Item deleted.")).toBeVisible();

  await openDashboard(page);
  await expect(page.getByRole("link", { name: /^Robot vacuum/ })).toHaveCount(0);
  await expect(deadlineCount(page)).toHaveText("0");
});

test("editing and deleting a subscription update its renewal and both averages", async ({ page }) => {
  const music = await addSubscription(page, "Music", "10", day(5));
  await openDashboard(page);
  await expect(soonGroup(page).getByRole("link", { name: /^Music/ })).toContainText("$10.00 per month");
  await expect(averageCost(page)).toHaveText("$10.00");

  await editSubscription(page, music, { amount: "20" });
  await page.goto("/subscriptions");
  await expect(page.getByText("Average monthly cost of active subscriptions: $20.00")).toBeVisible();
  await openDashboard(page);
  await expect(soonGroup(page).getByRole("link", { name: /^Music/ })).toContainText("$20.00 per month");
  await expect(averageCost(page)).toHaveText("$20.00");

  // A later anchor moves the next charge out of the window; the plan still costs the same.
  await editSubscription(page, music, { firstBillingDate: day(40) });
  await openDashboard(page);
  await expect(page.getByRole("link", { name: /^Music/ })).toHaveCount(0);
  await expect(averageCost(page)).toHaveText("$20.00");

  await page.goto(music);
  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete subscription" }).click();
  await expect(page.getByText("Subscription deleted.")).toBeVisible();
  await openDashboard(page);
  await expect(averageCost(page)).toHaveText("$0.00");
});

test("an open dashboard drops today's deadline after local midnight", async ({ page }) => {
  await addItem(page, "Concert ticket", { returnDeadline: day(0), warrantyExpiration: day(1) });

  // The records exist; now the browser clock stops at 23:59 tonight and then runs past midnight.
  await page.clock.install({ time: oneMinuteBeforeMidnight() });
  await page.goto("/dashboard");
  const events = soonGroup(page).getByRole("link", { name: /^Concert ticket/ });
  await expect(events).toHaveCount(2);
  await expect(events.first()).toContainText("Due today");
  await expect(events.last()).toContainText("Due tomorrow");

  await page.clock.fastForward("02:00");

  await expect(events).toHaveCount(1);
  await expect(events.first()).toContainText("Warranty expiration");
  await expect(events.first()).toContainText("Due today");
  await expect(deadlineCount(page)).toHaveText("1");
});

test("double-clicking Save stores one item and one subscription", async ({ page }) => {
  await page.goto("/items/new");
  await page.getByLabel(/^Name/).fill("Desk lamp");
  await page.getByLabel(/^Purchase date/).fill(day(0));
  await page.getByRole("button", { name: "Save item" }).dblclick();
  await expect(page).toHaveURL(ITEM_URL);
  await page.goto("/items");
  await expect(page.getByRole("link", { name: "Desk lamp" })).toHaveCount(1);

  await page.goto("/subscriptions/new");
  await page.getByLabel(/^Service name/).fill("Cloud storage");
  await page.getByLabel(/^Amount/).fill("2.99");
  await page.getByLabel(/^First billing date/).fill(day(3));
  await page.getByRole("button", { name: "Save subscription" }).dblclick();
  await expect(page).toHaveURL(SUBSCRIPTION_URL);
  await page.goto("/subscriptions");
  await expect(page.getByRole("link", { name: "Cloud storage" })).toHaveCount(1);
  await expect(page.getByText("Average monthly cost of active subscriptions: $2.99")).toBeVisible();
});

test("the add and edit forms fit a phone screen and show where the focus is", async ({ page }) => {
  const lamp = await addItem(page, "Desk lamp", { returnDeadline: day(10) });
  const plan = await addSubscription(page, "Cloud storage", "2.99", day(3));
  await page.setViewportSize({ width: 375, height: 667 });

  for (const [path, save] of [
    ["/items/new", "Save item"],
    [`${new URL(lamp).pathname}/edit`, "Save item"],
    ["/subscriptions/new", "Save subscription"],
    [`${new URL(plan).pathname}/edit`, "Save subscription"],
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);

    const saveButton = page.getByRole("button", { name: save });
    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeInViewport({ ratio: 1 });

    // The first field takes the focus from the keyboard, and the focus ring is visible.
    const firstField = page.getByLabel(path.startsWith("/items") ? /^Name/ : /^Service name/);
    await firstField.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(firstField).toBeFocused();
    const outline = await firstField.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline, `${path} focus ring`).not.toBe("none");
  }
});

test("editing and deleting records sends no failing requests to the site", async ({ page, baseURL }) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(baseURL!)) {
      failures.push(`${response.status()} ${response.request().method()} ${response.url().slice(baseURL!.length)}`);
    }
  });

  const coat = await addItem(page, "Wool coat", { returnDeadline: day(3) });
  await editReturnDeadline(page, coat, day(5));
  await page.getByRole("button", { name: "Delete item" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByText("Item deleted.")).toBeVisible();

  const music = await addSubscription(page, "Music", "9.99", day(4));
  await editSubscription(page, music, { amount: "19.99" });
  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete subscription" }).click();
  await expect(page.getByText("Subscription deleted.")).toBeVisible();
  await openDashboard(page);

  expect(failures).toEqual([]);
});
