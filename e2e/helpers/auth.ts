import { type Page } from "@playwright/test";

const ADMIN_CREDENTIALS = {
  email: "admin@example.com",
  password: "password12345",
};

const COACH_CREDENTIALS = {
  email: "coach@thedisciplineprogram.com",
  password: "password12345",
};

export const loginAsAdmin = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_CREDENTIALS.email);
  await page.getByLabel("Password").fill(ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
};

export const loginAsCoach = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(COACH_CREDENTIALS.email);
  await page.getByLabel("Password").fill(COACH_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/coach/);
};

export { ADMIN_CREDENTIALS, COACH_CREDENTIALS };
