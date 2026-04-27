import { type Page } from "@playwright/test";

const ADMIN_CREDENTIALS = {
  email: "admin@example.com",
  password: "password12345",
};

const COACH_CREDENTIALS = {
  email: "coach@thedisciplineprogram.com",
  password: "password12345",
};

const HEAD_COACH_CREDENTIALS = {
  email: "head-coach@thedisciplineprogram.com",
  password: "password12345",
};

export const loginAsAdmin = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_CREDENTIALS.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
};

export const loginAsCoach = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(COACH_CREDENTIALS.email);
  await page.getByLabel("Password", { exact: true }).fill(COACH_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/coach/);
};

export const loginAsHeadCoach = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(HEAD_COACH_CREDENTIALS.email);
  await page.getByLabel("Password", { exact: true }).fill(HEAD_COACH_CREDENTIALS.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
};

export { ADMIN_CREDENTIALS, COACH_CREDENTIALS, HEAD_COACH_CREDENTIALS };
