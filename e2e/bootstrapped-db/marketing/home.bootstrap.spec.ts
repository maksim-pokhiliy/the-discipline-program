import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing / — bootstrapped DB (sections with data={})", () => {
  test("renders without SSR crash when sections exist but are empty", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible({
      timeout: 15_000,
    });

    finalizeConsole();
  });
});
