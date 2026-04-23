import { expect, test } from "@playwright/test";

import { cleanupByIds } from "../helpers/database";

const createdPlanIds: string[] = [];

test.afterAll(async () => {
  if (createdPlanIds.length > 0) {
    await cleanupByIds(createdPlanIds.map((id) => ({ table: "trainingPlan", id })));
  }
});

test.describe("Coach Training Plans", () => {
  test("loads plans page", async ({ page }) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("displays plan cards", async ({ page }) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[class*='MuiPaper-outlined']").first()).toBeVisible();
  });

  test("creates a plan via dialog", async ({ page }) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("New Training Plan")).toBeVisible();

    const planName = `E2E Test Plan ${Date.now()}`;

    await page.getByLabel("Plan name").fill(planName);

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/platform/training-plans") &&
        res.request().method() === "POST" &&
        res.status() === 201,
    );

    await page.getByRole("button", { name: "Create" }).last().click();
    const response = await responsePromise;
    const body = await response.json();

    if (body?.id) {
      createdPlanIds.push(body.id);
    }

    await expect(page.getByText(planName)).toBeVisible();
  });

  test("navigates to plan detail", async ({ page }) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });

    await page.locator("a[href*='/coach/plans/']").first().click();
    await expect(page).toHaveURL(/\/coach\/plans\/.+/);
  });

  test("plan action menu works", async ({ page }) => {
    await page.goto("/coach/plans");
    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });

    await page
      .locator("button")
      .filter({ has: page.locator("[data-testid='MoreVertIcon']") })
      .first()
      .click();

    await expect(page.getByRole("menuitem", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();
  });
});
