import { expect, test } from "@playwright/test";

import {
  cleanupByIds,
  disconnectDb,
  getPrisma,
  insertWorkoutFlow,
  seedAthleteEnrollment,
  seedCoachPlan,
  seedSystemExercise,
} from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
});

test.describe("Coach dashboard analytics", () => {
  test("dashboard renders Pulse / Progress / Athletes Today sections", async ({ page }) => {
    test.setTimeout(120_000);

    const dashboardResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/platform/coach/dashboard") &&
        response.request().method() === "GET" &&
        response.status() === 200,
      { timeout: 30_000 },
    );

    await page.goto("/coach");

    await dashboardResponsePromise;

    await expect(page.getByText("Today").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("This Week").first()).toBeVisible();
    await expect(page.getByText("Athletes").first()).toBeVisible();
    await expect(page.getByText("Plans").first()).toBeVisible();
  });

  test("Pulse stats reflect non-zero athlete and plan counts after seeding", async ({ page }) => {
    test.setTimeout(180_000);

    const coach = await getPrisma().user.findUniqueOrThrow({
      where: { email: "coach@thedisciplineprogram.com" },
    });
    const athlete = await getPrisma().user.findUniqueOrThrow({
      where: { email: "tom.bradley@email.com" },
    });

    const exercise = await seedSystemExercise({
      name: `E2E Dashboard ${Date.now().toString()}`,
    });

    cleanups.push({ table: "exerciseLibraryItem", id: exercise.id });

    const seed = await seedCoachPlan({
      creatorId: coach.id,
      name: `E2E Dashboard Plan ${Date.now().toString()}`,
      withEntryFor: { exerciseId: exercise.id },
    });

    cleanups.unshift({ table: "trainingPlan", id: seed.plan.id });

    await getPrisma().trainingPlan.update({
      where: { id: seed.plan.id },
      data: { status: "ACTIVE" },
    });

    const enrollment = await seedAthleteEnrollment({
      planId: seed.plan.id,
      athleteId: athlete.id,
    });

    const flow = await insertWorkoutFlow({
      athleteUserId: athlete.id,
      exerciseId: exercise.id,
      loadKg: 100,
      reps: 5,
      enrollmentId: enrollment.id,
    });

    cleanups.unshift({ table: "workoutSession", id: flow.workoutSessionId });

    const dashboardResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/platform/coach/dashboard") &&
        response.request().method() === "GET" &&
        response.status() === 200,
      { timeout: 30_000 },
    );

    await page.goto("/coach");

    const dashboardResponse = await dashboardResponsePromise;
    const body = (await dashboardResponse.json()) as {
      overview: {
        totalActiveAthletes: number;
        activePlansCount: number;
      };
    };

    expect(body.overview.totalActiveAthletes).toBeGreaterThanOrEqual(1);
    expect(body.overview.activePlansCount).toBeGreaterThanOrEqual(1);
  });
});
