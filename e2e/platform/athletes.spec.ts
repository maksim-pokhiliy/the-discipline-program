import { expect, test } from "@playwright/test";

test.describe("Coach Athletes", () => {
  test("loads athletes page", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });
  });

  test("displays summary stats", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Total").first()).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
    await expect(page.getByText("Attention").first()).toBeVisible();
    await expect(page.getByText("Health").first()).toBeVisible();
  });

  test("displays athlete list items", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Sarah Mitchell").first()).toBeVisible();
  });

  test("search filter works", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    await page.getByPlaceholder("Search by name or email...").fill("Sarah");
    await expect(page).toHaveURL(/search=Sarah/);
    await expect(page.getByText("Sarah Mitchell").first()).toBeVisible();
  });

  test("filter chips work", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    await page.getByText("Needs Attention", { exact: true }).click();
    await expect(page).toHaveURL(/needsAttention=true/);
  });

  test("click athlete opens detail drawer", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    await page.getByText("Sarah Mitchell").first().click();
    await expect(page).toHaveURL(/athlete=/);
    await expect(page.getByText("Athlete Details")).toBeVisible();
  });

  test("drawer shows athlete sections", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    await page.getByText("Sarah Mitchell").first().click();
    await expect(page.getByText("Athlete Details")).toBeVisible();
    await expect(page.getByText("Discipline").first()).toBeVisible();
    await expect(page.getByText("Consistency").first()).toBeVisible();
  });

  test("close drawer removes URL param", async ({ page }) => {
    await page.goto("/coach/athletes");
    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    await page.getByText("Sarah Mitchell").first().click();
    await expect(page).toHaveURL(/athlete=/);
    await expect(page.getByText("Athlete Details")).toBeVisible();

    await page
      .locator("button")
      .filter({ has: page.locator("[data-testid='CloseIcon']") })
      .click();
    await expect(page).not.toHaveURL(/athlete=/);
  });
});
