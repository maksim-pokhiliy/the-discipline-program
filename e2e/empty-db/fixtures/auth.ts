import { type Page } from "@playwright/test";

import type { UserRole } from "@repo/contracts/iam/auth";

import { ADMIN_CREDENTIALS, COACH_CREDENTIALS } from "../../helpers/auth";

export const ATHLETE_CREDENTIALS = {
  email: "athlete@thedisciplineprogram.com",
  password: "password12345",
};

export const loginAsAthlete = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ATHLETE_CREDENTIALS.email);
  await page.getByLabel("Password", { exact: true }).fill(ATHLETE_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/athlete/);
};

export type EmptyDbAuthUser = {
  email: string;
  password: string;
  role: UserRole;
  storageStatePath: string;
};

export { ADMIN_CREDENTIALS, COACH_CREDENTIALS };
export { loginAsAdmin, loginAsCoach } from "../../helpers/auth";
