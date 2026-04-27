import { expect, test, type Page } from "@playwright/test";

const navigateToPlanDetail = async (page: Page, tab?: "athletes" | "schedule") => {
  await page.goto("/coach/plans");
  await expect(page.getByRole("heading", { name: "Training Plans" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Loading plans...")).toBeHidden({ timeout: 30_000 });

  const planLink = page.locator("a[href*='/coach/plans/']").first();
  const href = await planLink.getAttribute("href");

  if (!href) {
    throw new Error("Expected at least one plan link on /coach/plans");
  }

  const target = tab ? `${href}?tab=${tab}` : href;

  await page.goto(target);
  await expect(page).toHaveURL(new RegExp(`/coach/plans/[^/?#]+(?:\\?tab=${tab ?? ""})?`));
};

test.describe("Coach Plan Detail", () => {
  test("schedule view renders editor chrome", async ({ page }) => {
    await navigateToPlanDetail(page, "schedule");

    await expect(page.getByRole("heading", { name: "Library" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible();
    await expect(page.getByText(/Weeks \d+–\d+ of \d+/)).toBeVisible();
  });

  test("schedule view shows week navigator with week labels", async ({ page }) => {
    await navigateToPlanDetail(page, "schedule");

    await expect(page.getByText(/Weeks \d+–\d+ of \d+/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^Week \d+/).first()).toBeVisible();
  });

  test("week navigator reflects URL fromWeek and toWeek params", async ({ page }) => {
    await navigateToPlanDetail(page, "schedule");

    await expect(page.getByText(/Weeks \d+–\d+ of \d+/)).toBeVisible({ timeout: 30_000 });

    const planUrl = new URL(page.url());

    planUrl.searchParams.set("tab", "schedule");
    planUrl.searchParams.set("fromWeek", "0");
    planUrl.searchParams.set("toWeek", "0");
    await page.goto(planUrl.toString());

    await expect(page.getByText(/Weeks 1–1 of \d+/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Previous weeks" })).toBeDisabled();
  });

  test("athletes view renders Athletes tab", async ({ page }) => {
    await navigateToPlanDetail(page, "athletes");

    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });
  });

  test("athletes view shows enrollments or empty state", async ({ page }) => {
    await navigateToPlanDetail(page, "athletes");

    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    const enrolledText = page.getByText("Enrolled").first();
    const emptyState = page.getByText("No athletes enrolled yet");

    await expect(enrolledText.or(emptyState)).toBeVisible();
  });

  test("enroll athlete dialog opens from athletes view", async ({ page }) => {
    await navigateToPlanDetail(page, "athletes");

    await expect(page.getByRole("tab", { name: "Athletes" })).toBeVisible({ timeout: 30_000 });

    const fabButton = page.locator("button[class*='MuiFab']");

    await expect(fabButton).toBeVisible();
    await fabButton.click();

    await expect(page.getByText("Enroll Athletes")).toBeVisible();
  });
});
