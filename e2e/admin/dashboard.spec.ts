import { expect, test } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("loads the dashboard", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Overview")).toBeVisible({ timeout: 15_000 });
  });

  test("displays content statistics", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Overview")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Contact Submissions")).toBeVisible();
    await expect(page.getByText("Reviews")).toBeVisible();
    await expect(page.getByText("Products")).toBeVisible();
    await expect(page.getByText("Blog Posts")).toBeVisible();
  });

  test("displays recent activity", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Recent Activity")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("list")).toBeVisible();
  });
});
