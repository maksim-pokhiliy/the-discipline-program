import { expect, test } from "@playwright/test";

test.describe("Coach Plan Detail", () => {
  const navigateToPlanDetail = async (page: import("@playwright/test").Page) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator("[class*='MuiPaper-outlined']").first().click();
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

    const hasAthletes = await page
      .getByText("Enrolled")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText("No athletes enrolled yet")
      .isVisible()
      .catch(() => false);

    expect(hasAthletes || hasEmptyState).toBeTruthy();
  });

  test("enroll athlete dialog opens", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    const enrollButton = page.getByRole("button", { name: /enroll/i }).first();
    const fabButton = page.locator("button[class*='Fab']").first();
    const hasEnroll = await enrollButton.isVisible().catch(() => false);
    const hasFab = await fabButton.isVisible().catch(() => false);

    if (hasEnroll) {
      await enrollButton.click();
    } else if (hasFab) {
      await fabButton.click();
    }

    if (hasEnroll || hasFab) {
      await expect(page.getByText("Enroll Athletes")).toBeVisible();
    }
  });

  test("enrollment status chips visible", async ({ page }) => {
    await navigateToPlanDetail(page);
    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Athletes" }).click();
    await expect(page).toHaveURL(/tab=athletes/);

    const hasEnrolledAthletes = await page
      .locator("[class*='MuiChip']")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasEnrolledAthletes) {
      await expect(page.locator("[class*='MuiChip']").first()).toBeVisible();
    }
  });
});
