import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Admin /users - empty DB", () => {
  test("lists the three auth users and filters to empty state", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/users");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("row").filter({ hasText: "admin@example.com" })).toHaveCount(1);
    await expect(
      page.getByRole("row").filter({ hasText: "coach@thedisciplineprogram.com" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("row").filter({ hasText: "athlete@thedisciplineprogram.com" }),
    ).toHaveCount(1);

    await page.getByPlaceholder("Search by email...").fill("no-such-user-exists");

    await expect(page.getByText("No users found.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("row").filter({ hasText: "admin@example.com" })).toHaveCount(0);

    finalizeConsole();
  });
});
