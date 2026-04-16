import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform /coach/athletes — empty DB", () => {
  test("renders empty state with no athletes enrolled", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/coach/athletes");

    await expect(page.getByRole("heading", { name: "Athletes" })).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.getByText("No athletes yet — enroll athletes in your plans to see them here"),
    ).toBeVisible();

    finalizeConsole();
  });
});
