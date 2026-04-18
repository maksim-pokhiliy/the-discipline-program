import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Marketing /storefront — empty DB", () => {
  test("renders without crashing when no products or storefront sections exist", async ({
    page,
  }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    const response = await page.goto("/storefront");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/storefront$/);
    await expect(page.getByRole("link", { name: "Programs" }).first()).toBeVisible({
      timeout: 15_000,
    });

    finalizeConsole();
  });
});
