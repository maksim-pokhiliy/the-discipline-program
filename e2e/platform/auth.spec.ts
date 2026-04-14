import { expect, test } from "@playwright/test";
import path from "path";

import { COACH_CREDENTIALS, loginAsCoach } from "../helpers/auth";

test.describe("Platform Authentication", () => {
  test("logs in with valid coach credentials", async ({ page }) => {
    await loginAsCoach(page);
    await expect(page).toHaveURL(/\/coach/);
    await page
      .context()
      .storageState({ path: path.join(__dirname, "..", ".auth", "platform-coach.json") });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(COACH_CREDENTIALS.email);
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("redirects protected routes to login", async ({ page }) => {
    await page.goto("/coach");
    await expect(page).toHaveURL(/\/login/);
  });
});
