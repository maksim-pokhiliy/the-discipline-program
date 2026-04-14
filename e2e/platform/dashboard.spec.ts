import { expect, test } from "@playwright/test";

test.describe("Coach Dashboard", () => {
  test("loads the dashboard", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
  });

  test("displays pulse stats", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Today").first()).toBeVisible();
    await expect(page.getByText("This Week").first()).toBeVisible();
    await expect(page.getByText("Attention").first()).toBeVisible();
    await expect(page.getByText("Plans").first()).toBeVisible();
    await expect(page.getByText("New").first()).toBeVisible();
  });

  test("displays action items section", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Needs Attention")).toBeVisible();
  });

  test("displays progress buckets", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: /On track/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Steady/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Falling behind/i })).toBeVisible();
  });

  test("displays athletes today section", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Athletes Today")).toBeVisible();
  });

  test("action item navigation", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });

    const viewAthleteLink = page.getByText("View Athlete").first();
    const hasViewAthlete = await viewAthleteLink.isVisible().catch(() => false);

    if (hasViewAthlete) {
      await expect(viewAthleteLink).toHaveAttribute("href", /\/coach\/athletes\?athlete=/);
    }
  });
});
