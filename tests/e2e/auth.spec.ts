import { expect, test, type Page } from "@playwright/test";

// Account flows against the running site and its database (issue #2). Each test registers a new,
// invented address, so runs never depend on or change someone else's records.
const PASSWORD = "correct horse battery";

function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function register(page: Page, email: string): Promise<void> {
  await page.goto("/register");
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("register, reach the dashboard, sign out, and lose access", async ({ page }) => {
  const email = uniqueEmail("flow");

  await register(page, email);
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
});

test("a private page sends a visitor to sign in and back after signing in", async ({ page }) => {
  const email = uniqueEmail("return");
  await register(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/dashboard");
  await page.getByLabel(/^Email/).fill(email.toUpperCase());
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();
});

test("wrong credentials show an error and keep the typed email", async ({ page }) => {
  const email = uniqueEmail("wrong");
  await register(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();

  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill("not the password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toHaveText("Invalid email or password.");
  await expect(page.getByLabel(/^Email/)).toHaveValue(email);
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("field errors appear next to the fields and a duplicate email is refused", async ({ page }) => {
  const email = uniqueEmail("dup");
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByLabel(/^Email/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(page.getByLabel(/^Email/)).toBeFocused();

  await register(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/register");
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("An account with this email already exists. Sign in instead.")).toBeVisible();
});

test("signing in works with the keyboard alone", async ({ page }) => {
  const email = uniqueEmail("keys");
  await register(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.getByLabel(/^Email/).focus();
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/^Password/)).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/dashboard$/);
});
