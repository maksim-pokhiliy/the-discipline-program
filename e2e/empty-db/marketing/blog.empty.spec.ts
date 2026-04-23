import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing /blog — empty DB", () => {
  test("renders without crashing when no blog page sections or posts exist", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/blog");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /read/i })).toHaveCount(0);

    finalizeConsole();
  });
});
