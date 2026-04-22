import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /pages - empty DB", () => {
  test("renders empty state when no marketing pages exist", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/pages");

    await expect(page.getByText("No marketing pages found.")).toBeVisible({ timeout: 30_000 });

    finalizeConsole();
  });
});
