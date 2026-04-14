import { expect, test } from "@playwright/test";
import path from "path";

import { ADMIN_CREDENTIALS } from "../helpers/auth";

test.describe("Admin Auth", () => {
  test("logs in with valid admin credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(ADMIN_CREDENTIALS.email);
    await page.getByLabel("Password").fill(ADMIN_CREDENTIALS.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");

    await page.context().storageState({ path: path.join(__dirname, "..", ".auth", "admin.json") });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(ADMIN_CREDENTIALS.email);
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("redirects protected routes to login", async ({ page }) => {
    await page.goto("/blog");

    await expect(page).toHaveURL(/\/login.*callbackUrl/);
  });
});
