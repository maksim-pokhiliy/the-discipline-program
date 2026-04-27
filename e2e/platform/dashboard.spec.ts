import { expect, test } from "@playwright/test";

test.describe("Coach Dashboard", () => {
  test("loads the dashboard", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });
  });

  test("displays pulse stats", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Today").first()).toBeVisible();
    await expect(page.getByText("This Week").first()).toBeVisible();
    await expect(page.getByText("Attention").first()).toBeVisible();
    await expect(page.getByText("Plans").first()).toBeVisible();
    await expect(page.getByText("New").first()).toBeVisible();
  });

  test("displays action items section", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Needs Attention")).toBeVisible();
  });

  test("displays athletes today section", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Athletes Today")).toBeVisible();
  });

  test("action item menu contains athlete link", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });

    const needsAttention = page.getByText("Needs Attention");
    await expect(needsAttention).toBeVisible();

    const actionButton = page
      .locator("button")
      .filter({ has: page.locator("[data-testid='MoreVertIcon']") })
      .first();
    await expect(actionButton).toBeVisible();
    await actionButton.click();

    const viewAthleteItem = page.getByRole("menuitem", { name: "View Athlete" });
    await expect(viewAthleteItem).toBeVisible();
    await expect(viewAthleteItem).toHaveAttribute("href", /\/coach\/athletes\?athlete=/);
  });
});
