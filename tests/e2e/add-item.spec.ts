import { expect, test } from "@playwright/test";

// Fix the user's time zone and clock so "today" is deterministic: Oct 23, 2026 in New York.
test.use({ timezoneId: "America/New_York" });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T02:30:00Z"));
});

// The homepage link from HW3 Run B was not imported; the Items list (#4) will link here.
test("adds an item, fixing field errors first", async ({ page }) => {
  await page.goto("/items/new");

  await expect(page.getByRole("heading", { level: 1, name: "Add item" })).toBeVisible();
  await expect(page.getByLabel(/^Purchase date/)).toHaveAttribute("max", "2026-10-23");

  await page.getByLabel(/^Price/).fill("49.999");
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page.getByText("Fix 3 fields to save this item.")).toBeVisible();
  await expect(page.getByLabel(/^Name/)).toBeFocused();
  await expect(page.getByText("Enter a name.")).toBeVisible();
  await expect(page.getByText("Use no more than two decimal places.")).toBeVisible();

  await page.getByLabel(/^Name/).fill("Wool coat");
  await page.getByLabel(/^Purchase date/).fill("2026-10-09");
  await page.getByLabel(/^Price/).fill("189.50");
  await page.getByLabel(/^Return deadline/).fill("2026-11-08");
  await page.getByRole("button", { name: "Save item" }).click();

  const status = page.getByRole("status");
  await expect(status).toContainText("Wool coat");
  await expect(status).toContainText("$189.50");
  await expect(status).toContainText("Nov 8, 2026");
  await expect(page.getByLabel(/^Name/)).toHaveValue("");
});

test("rejects a purchase date after the user's local today", async ({ page }) => {
  await page.goto("/items/new");

  await page.getByLabel(/^Name/).fill("Running shoes");
  await page.getByLabel(/^Purchase date/).fill("2026-10-24");
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page.getByText("Purchase date can’t be in the future.")).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
});

test("can be completed with the keyboard only", async ({ page }) => {
  await page.goto("/items/new");

  await page.getByLabel(/^Name/).focus();
  await page.keyboard.type("Desk lamp");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/^Purchase date/)).toBeFocused();
  await page.getByLabel(/^Purchase date/).fill("2026-10-23");
  await page.getByLabel(/^Purchase date/).press("Enter");

  await expect(page.getByRole("status")).toContainText("Desk lamp");
});

test("cancel returns to the homepage", async ({ page }) => {
  await page.goto("/items/new");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("accepts a purchase from the new day after the page stays open past midnight", async ({ page }) => {
  // 23:59 on Nov 4, 2026 in New York; the clock then runs past midnight without a reload.
  await page.clock.install({ time: new Date("2026-11-05T04:59:00Z") });
  await page.goto("/items/new");
  await expect(page.getByLabel(/^Purchase date/)).toHaveAttribute("max", "2026-11-04");

  await page.clock.fastForward("02:00");

  await expect(page.getByLabel(/^Purchase date/)).toHaveAttribute("max", "2026-11-05");
  await page.getByLabel(/^Name/).fill("Night bus ticket");
  await page.getByLabel(/^Purchase date/).fill("2026-11-05");
  await page.getByRole("button", { name: "Save item" }).click();

  await expect(page.getByText("Purchase date can’t be in the future.")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Night bus ticket");
});
