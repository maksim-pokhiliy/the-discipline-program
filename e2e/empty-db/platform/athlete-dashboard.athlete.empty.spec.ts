import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform /athlete — empty DB", () => {
  test("renders athlete dashboard with no enrollments", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/athlete");

    await expect(page.getByRole("heading", { name: "Athlete Dashboard" })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText("Coming soon")).toBeVisible();

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    expect(bodyText).not.toContain("nan");
    expect(bodyText).not.toContain("undefined");

    finalizeConsole();
  });
});
