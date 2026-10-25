import { expect, test } from "@playwright/test";

test("homepage loads with the B4Gone heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("B4Gone");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "B4Gone" })).toBeVisible();
  await expect(page.getByText(/project setup is complete/i)).toBeVisible();
});
