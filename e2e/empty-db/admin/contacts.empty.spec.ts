import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /contacts - empty DB", () => {
  test("renders empty DataTable", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/contacts");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("No contact submissions found.")).toBeVisible();

    finalizeConsole();
  });
});
