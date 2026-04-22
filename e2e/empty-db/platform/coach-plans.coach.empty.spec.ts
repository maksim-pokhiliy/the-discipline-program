import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform /coach/plans — empty DB", () => {
  test("renders empty state with no plans and create action available", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach/plans");

    await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByText("No plans in this category")).toBeVisible();

    await expect(page.getByRole("button", { name: "Create Plan" })).toBeVisible();

    finalizeConsole();
  });
});
