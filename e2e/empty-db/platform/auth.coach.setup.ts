import path from "path";

import { test } from "@playwright/test";

import { loginAsCoach } from "../fixtures/auth";

test.describe("Empty DB Platform Coach Auth", () => {
  test("creates coach-empty storageState", async ({ page }) => {
    await loginAsCoach(page);

    await page
      .context()
      .storageState({ path: path.join(__dirname, "..", "..", ".auth", "coach-empty.json") });
  });
});
