import { expect, test } from "@playwright/test";

test.describe("Marketing Blog", () => {
  test("loads the blog list page", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByText("The Whiteboard")).toBeVisible({ timeout: 15_000 });
  });

  test("displays blog post cards", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: /read/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("loads blog article page", async ({ page }) => {
    await page.goto("/blog/mastering-bar-muscle-up");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
  });

  test("navigates to blog article", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: /read/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("link", { name: /read/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/.+/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });

  test("back navigation works", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: /read/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("link", { name: /read/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/.+/, { timeout: 30_000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByText("The Whiteboard")).toBeVisible({ timeout: 15_000 });
  });
});
