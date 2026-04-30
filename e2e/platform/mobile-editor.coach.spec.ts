import { type Page, expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { cleanupByIds, disconnectDb, seedCoachPlan } from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];
let prisma: PrismaClient | null = null;

const prismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

const seedScenario = async (suffix: string) => {
  const coach = await prismaClient().user.findUniqueOrThrow({
    where: { email: "coach@thedisciplineprogram.com" },
  });

  const seed = await seedCoachPlan({
    creatorId: coach.id,
    name: `E2E Mobile ${suffix} ${Date.now().toString()}`,
  });

  cleanups.unshift({ table: "trainingPlan", id: seed.plan.id });

  return seed;
};

const openMobileSchedule = async (page: Page, planId: string): Promise<void> => {
  await page.goto(`/coach/plans/${planId}?tab=schedule`);

  await expect(page.getByRole("button", { name: /Library/i, exact: false })).toBeVisible({
    timeout: 30_000,
  });
};

test.use({ viewport: { width: 375, height: 812 } });

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

test.describe("Mobile editor — bottom navigation + drawers (viewport 375x812)", () => {
  test("renders bottom navigation with Library, Canvas, Inspector tabs", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedScenario("nav");

    await openMobileSchedule(page, seed.plan.id);

    await expect(page.getByRole("button", { name: /Library/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Canvas/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Inspector/i }).first()).toBeVisible();
  });

  test("tapping Library opens the bottom drawer with template tabs", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedScenario("library-drawer");

    await openMobileSchedule(page, seed.plan.id);

    await page
      .getByRole("button", { name: /Library/i })
      .first()
      .click();

    await expect(page.getByRole("heading", { name: "Library" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: "Block tpl", exact: true })).toBeVisible();
  });

  test("tapping Inspector opens the bottom drawer with placeholder content", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedScenario("inspector-drawer");

    await openMobileSchedule(page, seed.plan.id);

    await page
      .getByRole("button", { name: /Inspector/i })
      .first()
      .click();

    await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible({ timeout: 15_000 });
  });

  test.skip("TODO touch DnD long-press drags a template onto canvas — Playwright touch flaky on WSL2; covered by use-plan-canvas-dnd unit tests, follow up with pointer-event simulation", () =>
    undefined);
});
