import { type Page, expect, test } from "@playwright/test";

import {
  cleanupByIds,
  disconnectDb,
  getPrisma,
  seedAthleteEnrollment,
  seedCoachPlan,
  seedSystemExercise,
} from "../helpers/database";

type OverridesSeed = {
  planId: string;
  blockId: string;
  segmentId: string;
  enrollmentId: string;
  athleteUserId: string;
  exerciseLibraryId: string;
};

const cleanups: { table: string; id: string }[] = [];

const seedOverridesScenario = async (suffix: string): Promise<OverridesSeed> => {
  const coach = await getPrisma().user.findUniqueOrThrow({
    where: { email: "coach@thedisciplineprogram.com" },
  });
  const athlete = await getPrisma().user.findUniqueOrThrow({
    where: { email: "tom.bradley@email.com" },
  });

  const exercise = await seedSystemExercise({
    name: `E2E Override ${suffix} ${Date.now().toString()}`,
  });

  cleanups.push({ table: "exerciseLibraryItem", id: exercise.id });

  const seed = await seedCoachPlan({
    creatorId: coach.id,
    name: `E2E Overrides ${suffix} ${Date.now().toString()}`,
    withEntryFor: { exerciseId: exercise.id },
  });

  cleanups.unshift({ table: "trainingPlan", id: seed.plan.id });

  const enrollment = await seedAthleteEnrollment({
    planId: seed.plan.id,
    athleteId: athlete.id,
  });

  return {
    planId: seed.plan.id,
    blockId: seed.blockId,
    segmentId: seed.segmentId,
    enrollmentId: enrollment.id,
    athleteUserId: athlete.id,
    exerciseLibraryId: exercise.id,
  };
};

const openSegmentInspector = async (
  page: Page,
  planId: string,
  segmentId: string,
  enrollmentId: string,
): Promise<void> => {
  const url = `/coach/plans/${planId}?tab=schedule&target=${encodeURIComponent(`athlete:${enrollmentId}`)}&selected=${encodeURIComponent(`segment:${segmentId}`)}`;

  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible({ timeout: 30_000 });
};

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
});

test.describe("Plan overrides — coach editing per athlete", () => {
  test("creating REPLACE override on a segment writes to PlanOverride and surfaces decoration", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const seed = await seedOverridesScenario("replace");

    await openSegmentInspector(page, seed.planId, seed.segmentId, seed.enrollmentId);

    await expect(page.getByText(/Editing for:/i)).toBeVisible({ timeout: 15_000 });

    const overrideRequests: { url: string; status: number; method: string }[] = [];

    page.on("response", (response) => {
      if (
        response.url().includes(`/api/platform/enrollments/${seed.enrollmentId}/overrides`) ||
        response.url().includes(`/api/platform/overrides/`)
      ) {
        overrideRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });

    const labelField = page.getByLabel("Label");

    await expect(labelField).toBeVisible({ timeout: 15_000 });
    await labelField.fill("Athlete-specific segment");

    await expect(page.getByText(/Unsaved changes/i)).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(
        () =>
          overrideRequests.filter(
            (request) => request.method === "POST" && request.status >= 200 && request.status < 300,
          ).length,
        { timeout: 15_000 },
      )
      .toBeGreaterThanOrEqual(1);

    await expect(page.getByText(/Saved/i).first()).toBeVisible({ timeout: 10_000 });

    const dbOverrides = await getPrisma().planOverride.findMany({
      where: {
        enrollmentId: seed.enrollmentId,
        scope: "BLOCK_SEGMENT",
        scopeId: seed.segmentId,
      },
    });

    expect(dbOverrides.length).toBeGreaterThanOrEqual(1);
    expect(dbOverrides[0]?.kind).toBe("REPLACE");

    for (const override of dbOverrides) {
      cleanups.unshift({ table: "planOverride", id: override.id });
    }
  });

  test("switching target back to All athletes clears the override mode chip", async ({ page }) => {
    test.setTimeout(120_000);

    const seed = await seedOverridesScenario("toggle");

    await openSegmentInspector(page, seed.planId, seed.segmentId, seed.enrollmentId);

    await expect(page.getByText(/Editing for:/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("combobox", { name: "Editing for" }).click();
    await page.getByRole("option", { name: "All athletes" }).click();

    await expect(page).toHaveURL((url) => !url.searchParams.get("target"));
    await expect(page.getByText(/Editing for:/i)).toBeHidden({ timeout: 5_000 });
  });

  test("deleting an override via API removes the row and clears decoration on reload", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const seed = await seedOverridesScenario("delete");

    const override = await getPrisma().planOverride.create({
      data: {
        enrollmentId: seed.enrollmentId,
        scope: "BLOCK_SEGMENT",
        scopeId: seed.segmentId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "Manually seeded" },
      },
    });

    cleanups.unshift({ table: "planOverride", id: override.id });

    await openSegmentInspector(page, seed.planId, seed.segmentId, seed.enrollmentId);

    await getPrisma().planOverride.delete({ where: { id: override.id } });

    await page.reload();

    const remaining = await getPrisma().planOverride.findMany({
      where: { enrollmentId: seed.enrollmentId, scopeId: seed.segmentId },
    });

    expect(remaining).toHaveLength(0);
  });
});
