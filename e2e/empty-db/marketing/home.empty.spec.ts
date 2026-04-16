import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing / — empty DB (CRITICAL)", () => {
  test("landing page renders on cold DB without SSR crash", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Programs" }).first()).toBeVisible({
      timeout: 15_000,
    });

    finalizeConsole();
  });
});
