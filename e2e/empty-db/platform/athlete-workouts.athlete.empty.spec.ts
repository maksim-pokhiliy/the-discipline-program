import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

test.describe("Platform /athlete (workouts surface) — empty DB", () => {
  test("athlete dashboard shows no workout data and no errors", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/athlete");

    await expect(page.getByRole("heading", { name: "Athlete Dashboard" })).toBeVisible({
      timeout: 15_000,
    });

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    expect(bodyText).not.toContain("nan");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toMatch(/\bnull\b/);

    await expect(page.getByRole("link", { name: /Home/i })).toBeVisible();

    finalizeConsole();
  });
});
