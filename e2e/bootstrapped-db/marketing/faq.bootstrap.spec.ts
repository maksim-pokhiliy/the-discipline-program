import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing /faq — bootstrapped DB (sections with data={})", () => {
  test("renders without SSR crash when sections exist but are empty", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/faq");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible({
      timeout: 30_000,
    });

    finalizeConsole();
  });
});
