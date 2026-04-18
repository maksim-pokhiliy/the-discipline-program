import { expect, test } from "@playwright/test";

test.describe("Coach Plan Detail", () => {
  const navigateToPlanDetail = async (page: import("@playwright/test").Page) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator("a[href*='/coach/plans/']").first().click();
    await expect(page).toHaveURL(/\/coach\/plans\/.+/);
  };

  test("loads plan detail with name", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.locator("input").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible();
  });

  test("tab navigation between Schedule and Athletes", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    await page.getByRole("tab", { name: "Schedule" }).click();
    await expect(page).toHaveURL(/tab=schedule/);
  });

  test("schedule tab shows week navigator", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Week \d+/)).toBeVisible();
  });

  test("week navigation updates URL", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByText(/Week \d+/)).toBeVisible({ timeout: 15_000 });

    const initialUrl = page.url();
    await page
      .locator("button")
      .filter({ has: page.locator("[data-testid='ChevronRightIcon']") })
      .click();
    await expect(page).not.toHaveURL(initialUrl);
    await expect(page).toHaveURL(/week=/);
  });

  test("athletes tab shows content", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    const enrolledText = page.getByText("Enrolled").first();
    const emptyState = page.getByText("No athletes enrolled yet");

    await expect(enrolledText.or(emptyState)).toBeVisible();
  });

  test("enroll athlete dialog opens", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    const fabButton = page.locator("button[class*='Fab']");
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    await expect(page.getByText("Enroll Athletes")).toBeVisible();
  });

  test("athletes tab shows enrollments or empty state", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    const tabPanel = page.getByRole("tabpanel");
    const enrollmentChip = tabPanel.locator("[class*='MuiChip']").first();
    const emptyState = page.getByText("No athletes enrolled yet");

    await expect(enrollmentChip.or(emptyState)).toBeVisible();
  });
});
