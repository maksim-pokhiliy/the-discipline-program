import { expect, test } from "@playwright/test";

import { expectNoConsoleErrors } from "../helpers/console";

const STAT_CARD_TITLES = [
  "Total Users",
  "Contact Submissions",
  "Reviews",
  "Products",
  "Blog Posts",
] as const;

test.describe("Admin / (dashboard) - empty DB", () => {
  test("renders stat cards with zeros and empty recent activity", async ({ page }) => {
    const finalizeConsole = expectNoConsoleErrors(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({ timeout: 30_000 });

    for (const title of STAT_CARD_TITLES) {
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    }

    await expect(page.getByText(/^\d+ joined this month$/)).toBeVisible();
    await expect(page.getByText("0 new, 0 processed")).toBeVisible();
    await expect(page.getByText("0 published")).toBeVisible();

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toContain("NaN");
    expect(bodyText).not.toContain("undefined");

    await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();
    await expect(page.getByText("New user registration").first()).toBeVisible();

    finalizeConsole();
  });
});
