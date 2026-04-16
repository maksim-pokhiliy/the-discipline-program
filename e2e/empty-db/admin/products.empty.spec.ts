import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /products - empty DB", () => {
  test("renders empty DataTable with create action", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/products");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("No products found. Start by creating one!")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Product" })).toBeVisible();

    finalizeConsole();
  });
});
