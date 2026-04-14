import { expect, test } from "@playwright/test";

import { cleanupByIds, seedTestBlogPost } from "../helpers/database";

const createdIds: { table: string; id: string }[] = [];

test.describe("Admin Blog CRUD", () => {
  test.afterAll(async () => {
    await cleanupByIds(createdIds);
  });

  test("lists blog posts", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.getByText("Blog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });

  test("navigates to create page", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Create Post" }).click();

    await page.waitForURL("/blog/create");
    await expect(page.getByText("Create Post")).toBeVisible();
  });

  test("creates a new blog post", async ({ page }) => {
    const timestamp = Date.now();
    const slug = `e2e-test-${timestamp}`;

    await page.goto("/blog/create");
    await expect(page.getByText("Create Post")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Post Title").fill(`E2E Test Post ${timestamp}`);
    await page.getByLabel("Slug").fill(slug);

    const editor = page.locator("[contenteditable]").first();
    await editor.click();
    await editor.fill("E2E test content for blog post creation");

    await page.getByLabel("Author Name").fill("E2E Tester");

    const categorySelect = page.getByLabel("Category");
    await categorySelect.click();
    await page.getByRole("option", { name: "Fitness" }).click();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/blog") && res.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Publish / Save" }).click();

    const response = await responsePromise;
    const body = await response.json();
    if (body?.id) {
      createdIds.push({ table: "marketingBlogPost", id: body.id });
    }

    await page.waitForURL("/blog");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("edits a blog post", async ({ page }) => {
    const seeded = await seedTestBlogPost();
    createdIds.push({ table: "marketingBlogPost", id: seeded.id });

    await page.goto("/blog");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

    const postRow = page.getByRole("row").filter({ hasText: seeded.title });
    await postRow.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/blog\/.+/);

    await expect(page.getByText("Edit Post")).toBeVisible({ timeout: 15_000 });

    const titleField = page.getByLabel("Post Title");
    const updatedTitle = `${seeded.title} (edited)`;
    await titleField.clear();
    await titleField.fill(updatedTitle);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/blog") && res.request().method() === "PUT",
    );

    await page.getByRole("button", { name: "Save Changes" }).click();
    await responsePromise;

    await page.goto("/blog");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(updatedTitle)).toBeVisible();
  });

  test("toggles featured status", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

    const firstRow = page.getByRole("row").nth(1);
    const featuredSwitch = firstRow.getByRole("checkbox").nth(1);

    const wasFeatured = await featuredSwitch.isChecked();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/blog") &&
        res.url().includes("toggle") &&
        res.request().method() === "PATCH",
    );

    await featuredSwitch.click();
    await responsePromise;

    const isNowFeatured = await featuredSwitch.isChecked();
    expect(isNowFeatured).toBe(!wasFeatured);

    await featuredSwitch.click();
    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/blog") &&
        res.url().includes("toggle") &&
        res.request().method() === "PATCH",
    );
  });

  test("deletes a blog post", async ({ page }) => {
    const seeded = await seedTestBlogPost();

    await page.goto("/blog");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

    const postRow = page.getByRole("row").filter({ hasText: seeded.title });
    await expect(postRow).toBeVisible();

    await postRow.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Delete Blog Post")).toBeVisible();
    await expect(page.getByText("Are you sure you want to delete this post?")).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/blog") && res.request().method() === "DELETE",
    );

    await page.getByRole("button", { name: "Delete" }).nth(1).click();
    await responsePromise;

    await expect(postRow).not.toBeVisible();
  });
});
