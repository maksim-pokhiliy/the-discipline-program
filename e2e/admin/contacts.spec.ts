import { expect, test } from "@playwright/test";

import { cleanupByIds, seedTestContact } from "../helpers/database";

const createdIds: { table: string; id: string }[] = [];

test.describe("Admin Contacts", () => {
  test.afterAll(async () => {
    await cleanupByIds(createdIds);
  });

  test("lists contact submissions", async ({ page }) => {
    await page.goto("/contacts");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });

  test("views contact detail", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.waitForURL(/\/contacts\/.+/);

    await expect(page.getByText("Contact Submission")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Contact Details")).toBeVisible();
  });

  test("updates contact status", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: "Edit" }).first().click();
    await page.waitForURL(/\/contacts\/.+/);
    await expect(page.getByText("Contact Submission")).toBeVisible({ timeout: 30_000 });

    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: "In Progress" }).click();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/contacts") && res.request().method() === "PUT",
    );

    await page.getByRole("button", { name: "Save Changes" }).click();
    await responsePromise;
  });

  test("deletes a contact", async ({ page }) => {
    const seeded = await seedTestContact();
    createdIds.push({ table: "marketingContactSubmission", id: seeded.id });

    await page.goto("/contacts");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });

    const contactRow = page.getByRole("row").filter({ hasText: "E2E Test Contact" });
    await expect(contactRow).toBeVisible();

    await contactRow.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Delete Submission")).toBeVisible();
    await expect(
      page.getByText("Are you sure you want to delete this contact submission?"),
    ).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/contacts") && res.request().method() === "DELETE",
    );

    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await responsePromise;

    await expect(contactRow).not.toBeVisible();

    createdIds.pop();
  });
});
