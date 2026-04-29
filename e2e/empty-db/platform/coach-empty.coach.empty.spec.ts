import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform coach surfaces — empty DB", () => {
  test("/coach: summary cards show zero values and panels render empty states", async ({
    page,
  }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach");

    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Today").first()).toBeVisible();
    await expect(page.getByText("This Week").first()).toBeVisible();
    await expect(page.getByText("Attention").first()).toBeVisible();
    await expect(page.getByText("Plans").first()).toBeVisible();
    await expect(page.getByText("New").first()).toBeVisible();

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    expect(bodyText).not.toContain("nan");
    expect(bodyText).not.toContain("undefined");

    await expect(page.getByText("Needs Attention")).toHaveCount(0);
    await expect(page.getByText("No athletes enrolled")).toBeVisible();

    finalizeConsole();
  });

  test("/coach/plans: renders empty state with create action available", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach/plans");

    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("No plans in this category")).toBeVisible();

    const createButtons = page.getByRole("button", { name: "Create Plan" });
    await expect(createButtons).toHaveCount(2);
    await expect(createButtons.last()).toBeVisible();

    finalizeConsole();
  });

  test("/coach/athletes: renders empty state with invite action", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach/athletes");

    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("No athletes yet — invite your first athlete")).toBeVisible();

    const inviteButtons = page.getByRole("button", { name: /Invite athlete/i });
    await expect(inviteButtons).toHaveCount(2);
    await expect(inviteButtons.last()).toBeVisible();

    finalizeConsole();
  });
});
