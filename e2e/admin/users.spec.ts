import { expect, test } from "@playwright/test";

test.describe("Admin Users", () => {
  test("lists users", async ({ page }) => {
    await page.goto("/users");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });

  test("views user detail", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("row").nth(1).getByRole("link").first().click();
    await page.waitForURL(/\/users\/.+/);

    await expect(page.getByText("User Details")).toBeVisible({ timeout: 30_000 });
  });

  test("displays user role correctly", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });

    const rows = page.getByRole("row");
    const rowCount = await rows.count();

    expect(rowCount).toBeGreaterThan(1);

    const hasRoleChip = await page
      .getByRole("row")
      .nth(1)
      .getByText(/^(Admin|Coach|Athlete)$/)
      .first()
      .isVisible();

    expect(hasRoleChip).toBe(true);
  });
});
