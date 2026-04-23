import { expect, test } from "@playwright/test";

test.describe("Marketing Contact Page", () => {
  test("loads contact page with form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Phone / Telegram / WhatsApp")).toBeVisible();
    await expect(page.getByLabel("Program Interest")).toBeVisible();
    await expect(page.getByLabel("Your Message")).toBeVisible();
  });

  test("submits contact form with valid data", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Phone / Telegram / WhatsApp").fill("@e2etest");
    await page.getByLabel("Your Message").fill("This is an E2E test submission");

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/public/contact") && res.status() < 400,
    );

    await page.getByRole("button", { name: "Send Message" }).click();
    await responsePromise;

    await expect(page.getByText("Message Sent!")).toBeVisible({ timeout: 30_000 });
  });

  test("shows validation errors on empty submission", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Name").fill("x");
    await page.getByLabel("Name").fill("");

    await expect(page.getByText("Name is required")).toBeVisible({ timeout: 10_000 });
  });
});
