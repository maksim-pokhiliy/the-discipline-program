import { type Page, expect, test } from "@playwright/test";
import { type Prisma, PrismaClient } from "@prisma/client";

import { cleanupByIds, disconnectDb, seedCoachPlan, seedSystemExercise } from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];

let prisma: PrismaClient | null = null;

const prismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

type ApplyScenario = {
  planId: string;
  sessionId: string;
  blockId: string;
  templateId: string;
};

const buildBlockTemplatePayload = (kindId: string): Prisma.InputJsonValue => ({
  order: 0,
  kindId,
  title: "E2E Template block",
  status: "ACTIVE",
  weight: 5,
  notes: null,
  segments: [
    {
      order: 0,
      label: "Template segment",
      archetypeKind: "COUNT_UP",
      schemeParams: { kind: "COUNT_UP", cap: 5, rounds: 3 },
      schemeTemplateId: null,
      restConfig: null,
      setGroups: [
        {
          order: 0,
          label: "Working sets",
          entries: [],
        },
      ],
    },
  ],
});

const seedTemplateScenario = async (suffix: string): Promise<ApplyScenario> => {
  const coach = await prismaClient().user.findUniqueOrThrow({
    where: { email: "coach@thedisciplineprogram.com" },
  });

  const exercise = await seedSystemExercise({
    name: `E2E Templates ${suffix} ${Date.now().toString()}`,
  });

  cleanups.push({ table: "exerciseLibraryItem", id: exercise.id });

  const planSeed = await seedCoachPlan({
    creatorId: coach.id,
    name: `E2E Templates Plan ${suffix} ${Date.now().toString()}`,
  });

  cleanups.unshift({ table: "trainingPlan", id: planSeed.plan.id });

  const blockKind = await prismaClient().blockKind.findFirstOrThrow({
    where: { scope: "SYSTEM", ownerId: null, name: "E2E Strength" },
  });

  const template = await prismaClient().blockTemplate.create({
    data: {
      scope: "COACH",
      ownerId: coach.id,
      name: `E2E Block Template ${suffix} ${Date.now().toString()}`,
      description: "Created by templates-apply spec",
      payload: buildBlockTemplatePayload(blockKind.id),
    },
  });

  cleanups.push({ table: "blockTemplate", id: template.id });

  return {
    planId: planSeed.plan.id,
    sessionId: planSeed.sessionId,
    blockId: planSeed.blockId,
    templateId: template.id,
  };
};

const openSchedule = async (page: Page, planId: string): Promise<void> => {
  await page.goto(`/coach/plans/${planId}?tab=schedule`);
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible({ timeout: 30_000 });
};

const switchToTab = async (page: Page, tabLabel: string): Promise<void> => {
  await page.getByRole("tab", { name: tabLabel, exact: true }).click();
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

test.describe("Templates apply — coach library to plan", () => {
  test("library panel renders 6 tabs including block/session/week templates", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedTemplateScenario("tabs");

    await openSchedule(page, seed.planId);

    const labels = ["Exercises", "Blocks", "Schemes", "Block tpl", "Session tpl", "Week tpl"];

    for (const label of labels) {
      await expect(page.getByRole("tab", { name: label, exact: true })).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("block-templates tab shows the seeded coach template", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedTemplateScenario("list");

    await openSchedule(page, seed.planId);
    await switchToTab(page, "Block tpl");

    const template = await prismaClient().blockTemplate.findUniqueOrThrow({
      where: { id: seed.templateId },
    });

    await expect(page.getByText(template.name).first()).toBeVisible({ timeout: 15_000 });
  });

  test("apply-template POST instantiates a block under the target session", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const seed = await seedTemplateScenario("apply");

    await openSchedule(page, seed.planId);

    const beforeCount = await prismaClient().block.count({
      where: { sessionId: seed.sessionId },
    });

    const response = await request.post(
      `http://localhost:3001/api/platform/training-plans/${seed.planId}/apply-template`,
      {
        data: {
          kind: "block",
          templateId: seed.templateId,
          target: { sessionId: seed.sessionId, order: 1 },
        },
      },
    );

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const afterCount = await prismaClient().block.count({
      where: { sessionId: seed.sessionId },
    });

    expect(afterCount).toBe(beforeCount + 1);
  });

  test("Cmd+Shift+S opens save template dialog when a block is selected", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedTemplateScenario("save");

    await page.goto(
      `/coach/plans/${seed.planId}?tab=schedule&selected=${encodeURIComponent(`block:${seed.blockId}`)}`,
    );

    await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible({ timeout: 30_000 });

    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+Shift+S`);

    await expect(page.getByRole("dialog", { name: /Save block as template/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.keyboard.press("Escape");
  });
});
