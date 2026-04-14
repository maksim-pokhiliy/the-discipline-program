import { expect, test } from "@playwright/test";

test.describe("Marketing Blog", () => {
  test("loads the blog list page", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByText("The Whiteboard")).toBeVisible();
  });

  test("displays blog post cards", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: /read/i }).first()).toBeVisible();
  });

  test("navigates to blog article", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: /read/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("back navigation works", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: /read/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/.+/);

    await page.goBack();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByText("The Whiteboard")).toBeVisible();
  });
});
