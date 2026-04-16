import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /blog - empty DB", () => {
  test("renders empty DataTable with create action", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/blog");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("No blog posts yet. Create the first one!")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Post" })).toBeVisible();

    finalizeConsole();
  });
});
