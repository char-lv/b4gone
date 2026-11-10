import { expect, type Page } from "@playwright/test";

// Registers a new, invented account through the real form and leaves the page signed in (issues #2, #3).
// Each call uses a fresh address, so runs never depend on or change someone else's records.
export const E2E_PASSWORD = "correct horse battery";

export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

export async function registerAndSignIn(page: Page, label: string): Promise<string> {
  const email = uniqueEmail(label);
  await page.goto("/register");
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Hashing at bcrypt cost 12 can take several seconds on a loaded machine, beyond the 5-second default.
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  return email;
}
