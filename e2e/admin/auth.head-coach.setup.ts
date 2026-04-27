import { test } from "@playwright/test";
import path from "path";

import { loginAsHeadCoach } from "../helpers/auth";

test.describe("Admin HEAD_COACH Auth", () => {
  test("creates head-coach storageState", async ({ page }) => {
    await loginAsHeadCoach(page);
    await page
      .context()
      .storageState({ path: path.join(__dirname, "..", ".auth", "admin-head-coach.json") });
  });
});
