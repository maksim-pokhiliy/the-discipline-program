import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing /about — empty DB", () => {
  test("renders without crashing when no marketing page sections exist", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/about");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("link", { name: "About" }).first()).toBeVisible({
      timeout: 15_000,
    });

    finalizeConsole();
  });
});
