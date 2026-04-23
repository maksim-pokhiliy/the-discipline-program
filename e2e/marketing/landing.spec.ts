import { expect, test } from "@playwright/test";

test.describe("Marketing Landing Page", () => {
  test("loads the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /discipline/i }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("displays hero section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your DISCIPLINE Dictates Your SUCCESS" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Start Training")).toBeVisible({ timeout: 30_000 });
  });

  test("displays features section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Why The Discipline Program?")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Constantly Varied")).toBeVisible();
    await expect(page.getByText("High Intensity")).toBeVisible();
  });

  test("displays reviews section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Community Results")).toBeVisible({ timeout: 30_000 });
  });

  test("navigates to other pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Blog" }).first().click();
    await expect(page).toHaveURL(/\/blog/);

    await page.getByRole("link", { name: "Contact" }).first().click();
    await expect(page).toHaveURL(/\/contact/);

    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about/);
  });
});
