import path from "path";

import { test } from "@playwright/test";

import { loginAsAdmin } from "../fixtures/auth";

test.describe("Empty DB Admin Auth", () => {
  test("creates admin-empty storageState", async ({ page }) => {
    await loginAsAdmin(page);

    await page
      .context()
      .storageState({ path: path.join(__dirname, "..", "..", ".auth", "admin-empty.json") });
  });
});
