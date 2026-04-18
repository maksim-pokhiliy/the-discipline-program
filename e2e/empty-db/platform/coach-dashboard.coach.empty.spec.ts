import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform /coach — empty DB", () => {
  test("summary cards show zero values and panels render empty states", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach");

    await expect(page.getByText("Athletes").first()).toBeVisible({ timeout: 15_000 });
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
});
