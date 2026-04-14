import { expect, test } from "@playwright/test";

import { cleanupByIds } from "../helpers/database";

let createdContactIds: string[] = [];

test.afterAll(async () => {
  if (createdContactIds.length > 0) {
    await cleanupByIds(
      createdContactIds.map((id) => ({ table: "marketingContactSubmission", id })),
    );
  }
});

test.describe("Marketing Contact Page", () => {
  test("loads contact page with form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Phone / Telegram / WhatsApp")).toBeVisible();
    await expect(page.getByLabel("Program Interest")).toBeVisible();
    await expect(page.getByLabel("Your Message")).toBeVisible();
  });

  test("submits contact form with valid data", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Phone / Telegram / WhatsApp").fill("@e2etest");
    await page.getByLabel("Your Message").fill("This is an E2E test submission");

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/public/contact") && res.status() === 200,
    );

    await page.getByRole("button", { name: "Send Message" }).click();
    const response = await responsePromise;
    const body = await response.json();

    if (body.data?.id) {
      createdContactIds.push(body.data.id);
    }

    await expect(page.getByText("Message Sent!")).toBeVisible();
  });

  test("shows validation errors on empty submission", async ({ page }) => {
    await page.goto("/contact");

    await page.getByLabel("Name").click();
    await page.getByLabel("Phone / Telegram / WhatsApp").click();
    await page.getByLabel("Your Message").click();
    await page.getByLabel("Name").click();

    await expect(page.getByText("Name is required")).toBeVisible();
  });
});
