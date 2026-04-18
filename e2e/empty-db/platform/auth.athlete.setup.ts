import path from "path";

import { test } from "@playwright/test";

import { loginAsAthlete } from "../fixtures/auth";

test.describe("Empty DB Platform Athlete Auth", () => {
  test("creates athlete-empty storageState", async ({ page }) => {
    await loginAsAthlete(page);

    await page
      .context()
      .storageState({ path: path.join(__dirname, "..", "..", ".auth", "athlete-empty.json") });
  });
});
