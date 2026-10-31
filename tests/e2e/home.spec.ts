import { expect, test } from "@playwright/test";

test("homepage introduces B4Gone and links to sign in and registration", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("B4Gone");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: /keep track of deadlines/i })).toBeVisible();
  await page.getByRole("link", { name: "Create account" }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
});
