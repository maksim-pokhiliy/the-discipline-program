import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing /blog — bootstrapped DB (sections with data={})", () => {
  test("renders without SSR crash when sections exist but are empty", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/blog");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible({
      timeout: 30_000,
    });

    finalizeConsole();
  });
});
