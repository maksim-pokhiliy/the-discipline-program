import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /reviews - empty DB", () => {
  test("renders empty DataTable with create action", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/reviews");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("No reviews found. Add your first review!")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Review" })).toBeVisible();

    finalizeConsole();
  });
});
