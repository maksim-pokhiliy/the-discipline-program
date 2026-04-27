import { type BrowserContext, type Page, type Request, expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { cleanupByIds, disconnectDb, seedCoachPlan } from "../helpers/database";

type SegmentSeed = { planId: string; segmentId: string };

const cleanups: { table: string; id: string }[] = [];

let prisma: PrismaClient | null = null;

const prismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

const seedSegmentForCoach = async (suffix: string): Promise<SegmentSeed> => {
  const coach = await prismaClient().user.findUniqueOrThrow({
    where: { email: "coach@thedisciplineprogram.com" },
  });
  const result = await seedCoachPlan({
    creatorId: coach.id,
    name: `EditSession ${suffix} ${Date.now().toString()}`,
  });

  cleanups.unshift({ table: "trainingPlan", id: result.plan.id });

  return { planId: result.plan.id, segmentId: result.segmentId };
};

const openSegmentInspector = async (
  page: Page,
  planId: string,
  segmentId: string,
): Promise<void> => {
  await page.goto(
    `/coach/plans/${planId}?tab=schedule&selected=${encodeURIComponent(`segment:${segmentId}`)}`,
  );
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Label")).toBeVisible({ timeout: 30_000 });
};

const collectPatchRequests = (context: BrowserContext, planId: string): { requests: Request[] } => {
  const requests: Request[] = [];

  context.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes(`/api/platform/training-plans/${planId}/patch`)
    ) {
      requests.push(request);
    }
  });

  return { requests };
};

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
});

test.describe("Edit session — coach inspector (production UI)", () => {
  test("does not save on blur; explicit Save sends exactly 1 PUT", async ({ page, context }) => {
    test.setTimeout(120_000);
    const seed = await seedSegmentForCoach("no-blur");
    const { requests } = collectPatchRequests(context, seed.planId);

    await openSegmentInspector(page, seed.planId, seed.segmentId);

    const labelField = page.getByLabel("Label");
    const saveButton = page.getByRole("button", { name: "Save" });

    await labelField.fill("Edited via test no blur");
    await expect(page.getByText(/Unsaved changes/i)).toBeVisible({ timeout: 3_000 });
    await labelField.blur();
    await page.waitForTimeout(1_500);

    expect(requests).toHaveLength(0);

    await expect(saveButton).toBeEnabled({ timeout: 5_000 });
    await saveButton.click();

    await expect.poll(() => requests.length, { timeout: 10_000 }).toBe(1);

    await expect(page.getByText(/Saved/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("idle 8s autosave fires when draft is valid", async ({ page, context }) => {
    test.setTimeout(120_000);
    const seed = await seedSegmentForCoach("idle-valid");
    const { requests } = collectPatchRequests(context, seed.planId);

    await openSegmentInspector(page, seed.planId, seed.segmentId);

    await page.getByLabel("Label").fill("Idle autosave label");

    await expect.poll(() => requests.length, { timeout: 12_000 }).toBeGreaterThanOrEqual(1);
  });

  test("idle autosave does NOT fire when draft is invalid", async ({ page, context }) => {
    test.setTimeout(120_000);
    const seed = await seedSegmentForCoach("idle-invalid");
    const { requests } = collectPatchRequests(context, seed.planId);

    await openSegmentInspector(page, seed.planId, seed.segmentId);

    const orderField = page.getByLabel("Order");

    await orderField.fill("");
    await page.getByLabel("Label").click();

    await page.waitForTimeout(8_500);

    expect(requests).toHaveLength(0);
  });

  test("concurrent-tab edit raises 409 conflict in second tab", async ({ browser }) => {
    test.setTimeout(180_000);
    const seed = await seedSegmentForCoach("concurrent");

    const contextA = await browser.newContext({
      storageState: "e2e/.auth/platform-coach.json",
      baseURL: "http://localhost:3001",
    });
    const contextB = await browser.newContext({
      storageState: "e2e/.auth/platform-coach.json",
      baseURL: "http://localhost:3001",
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await openSegmentInspector(pageA, seed.planId, seed.segmentId);
      await openSegmentInspector(pageB, seed.planId, seed.segmentId);

      const aSavePromise = pageA.waitForResponse(
        (res) =>
          res.url().includes(`/api/platform/training-plans/${seed.planId}/patch`) &&
          res.request().method() === "POST",
        { timeout: 15_000 },
      );

      await pageA.getByLabel("Label").fill("Tab A wins");
      await pageA.getByRole("button", { name: "Save" }).click();
      await aSavePromise;
      await expect(pageA.getByText(/Saved/i).first()).toBeVisible({ timeout: 10_000 });

      const bSavePromise = pageB.waitForResponse(
        (res) =>
          res.url().includes(`/api/platform/training-plans/${seed.planId}/patch`) &&
          res.request().method() === "POST",
        { timeout: 15_000 },
      );

      await pageB.getByLabel("Label").fill("Tab B stale");
      await pageB.getByRole("button", { name: "Save" }).click();
      await bSavePromise;

      await expect(pageB.getByText(/Edited in another window/i)).toBeVisible({ timeout: 10_000 });
      await expect(pageB.getByRole("button", { name: /Reload from server/i })).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
