import { expect, test } from "@playwright/test";

const STORY_ID = "edit-session-multi-card-cmd-s--three-cards-focused-cmd-s";

test.describe("Edit session — multi-card focused Cmd+S + route-change confirm", () => {
  test("Cmd+S targets focused card; modal lists 2 unsaved drafts; Save All flushes them", async ({
    page,
  }) => {
    const segmentRequests: { url: string; segmentId: string }[] = [];

    await page.route("**/api/platform/segments/**", async (route) => {
      const url = route.request().url();
      const tail = url.split("/api/platform/segments/")[1] ?? "";
      const segmentId = tail.split(/[?#]/)[0] ?? "";

      segmentRequests.push({ url, segmentId });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`/iframe.html?id=${STORY_ID}&viewMode=story`, {
      waitUntil: "load",
    });

    const card1 = page.getByTestId("label-card-1");
    const card2 = page.getByTestId("label-card-2");
    const card3 = page.getByTestId("label-card-3");

    await expect(card1).toBeVisible({ timeout: 30_000 });

    await card1.fill("dirty 1");
    await card2.fill("dirty 2");
    await card3.fill("dirty 3");

    await card1.focus();

    const isMac = process.platform === "darwin";
    const saveKey = isMac ? "Meta+s" : "Control+s";

    await page.keyboard.press(saveKey);

    await expect.poll(() => segmentRequests.length, { timeout: 10_000 }).toBe(1);
    expect(segmentRequests[0]?.segmentId).toBe("card-1");

    await expect(page.locator('[data-segment-id="card-1"]').getByText(/Saved/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('[data-segment-id="card-2"]').getByText(/Unsaved changes/i),
    ).toBeVisible();
    await expect(
      page.locator('[data-segment-id="card-3"]').getByText(/Unsaved changes/i),
    ).toBeVisible();

    await page.getByTestId("library-link").click();

    const modal = page.getByRole("dialog", { name: /Unsaved changes/i });

    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/You have 2 unsaved drafts/i)).toBeVisible();
    await expect(modal.getByText("Segment card-2")).toBeVisible();
    await expect(modal.getByText("Segment card-3")).toBeVisible();
    await expect(modal.getByText("Segment card-1")).toBeHidden();

    const beforeCount = segmentRequests.length;

    await modal.getByRole("button", { name: /Save all/i }).click();

    await expect.poll(() => segmentRequests.length, { timeout: 10_000 }).toBe(beforeCount + 2);
    await expect(modal).toBeHidden({ timeout: 10_000 });

    const ids = segmentRequests
      .slice(beforeCount)
      .map((r) => r.segmentId)
      .sort();

    expect(ids).toEqual(["card-2", "card-3"]);
  });
});
