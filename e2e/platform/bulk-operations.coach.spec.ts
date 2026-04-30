import { type Page, expect, test } from "@playwright/test";
import { type Prisma } from "@prisma/client";

import {
  cleanupByIds,
  disconnectDb,
  getPrisma,
  seedCoachPlan,
  seedSystemExercise,
} from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];

type BulkScenarioSeed = {
  planId: string;
  setGroupId: string;
  entryIds: string[];
  exerciseLibraryId: string;
};

const buildEntryData = (
  setGroupId: string,
  exercise: {
    id: string;
    name: string;
    primaryMovement: string;
    modality: string;
    primaryBodyParts: string[];
    defaultMetrics: Prisma.JsonValue;
    demoVideoUrl: string | null;
    demoImageUrl: string | null;
  },
  order: number,
): Prisma.ExerciseEntryCreateManyInput => ({
  setGroupId,
  order,
  exerciseId: exercise.id,
  exerciseSnapshot: {
    id: exercise.id,
    name: exercise.name,
    primaryMovement: exercise.primaryMovement,
    modality: exercise.modality,
    primaryBodyParts: exercise.primaryBodyParts,
    defaultMetrics: exercise.defaultMetrics,
    demoVideoUrl: exercise.demoVideoUrl,
    demoImageUrl: exercise.demoImageUrl,
  } as Prisma.InputJsonValue,
  prescription: {
    reps: { kind: "FIXED", value: 5 },
    sideMode: "BILATERAL",
    modifiers: [],
  } as Prisma.InputJsonValue,
  alternatives: [],
});

const seedBulkScenario = async (suffix: string, entryCount: number): Promise<BulkScenarioSeed> => {
  const coach = await getPrisma().user.findUniqueOrThrow({
    where: { email: "coach@thedisciplineprogram.com" },
  });

  const exercise = await seedSystemExercise({
    name: `E2E Bulk ${suffix} ${Date.now().toString()}`,
  });

  cleanups.push({ table: "exerciseLibraryItem", id: exercise.id });

  const seed = await seedCoachPlan({
    creatorId: coach.id,
    name: `E2E Bulk Plan ${suffix} ${Date.now().toString()}`,
  });

  cleanups.unshift({ table: "trainingPlan", id: seed.plan.id });

  const entryIds: string[] = [];

  for (let i = 0; i < entryCount; i += 1) {
    const created = await getPrisma().exerciseEntry.create({
      data: buildEntryData(seed.setGroupId, exercise, i),
    });

    entryIds.push(created.id);
  }

  return {
    planId: seed.plan.id,
    setGroupId: seed.setGroupId,
    entryIds,
    exerciseLibraryId: exercise.id,
  };
};

const openSchedule = async (page: Page, planId: string, selectedParam: string): Promise<void> => {
  await page.goto(
    `/coach/plans/${planId}?tab=schedule&selected=${encodeURIComponent(selectedParam)}`,
  );
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible({ timeout: 30_000 });
};

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
});

test.describe("Bulk operations — multi-select on canvas", () => {
  test("multi-selecting two entries renders the bulk action toolbar with selection count", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const seed = await seedBulkScenario("toolbar", 2);

    const selectedParam = `entry:${seed.entryIds.join(",")}`;

    await openSchedule(page, seed.planId, selectedParam);

    await expect(page.getByText("2 entries selected")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Replace exercise" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Delete entries/i })).toBeVisible();
  });

  test("bulk delete removes the selected entries", async ({ page }) => {
    test.setTimeout(180_000);
    const seed = await seedBulkScenario("delete", 2);

    const selectedParam = `entry:${seed.entryIds.join(",")}`;

    await openSchedule(page, seed.planId, selectedParam);

    await expect(page.getByText("2 entries selected")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Delete entries/i }).click();

    const dialog = page.getByRole("dialog", { name: /Delete 2 entries/i });

    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const patchPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/platform/training-plans/${seed.planId}/patch`) &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await dialog.getByRole("button", { name: /Delete entries/i }).click();

    await patchPromise;

    await expect
      .poll(
        async () =>
          getPrisma().exerciseEntry.count({
            where: { id: { in: seed.entryIds } },
          }),
        { timeout: 15_000 },
      )
      .toBe(0);
  });

  test("bulk replace dialog opens and previews selected entries", async ({ page }) => {
    test.setTimeout(120_000);
    const seed = await seedBulkScenario("replace", 2);

    const selectedParam = `entry:${seed.entryIds.join(",")}`;

    await openSchedule(page, seed.planId, selectedParam);

    await expect(page.getByText("2 entries selected")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Replace exercise" }).click();

    const dialog = page.getByRole("dialog", { name: /Replace selected entries/i });

    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.getByRole("button", { name: /Cancel/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});
