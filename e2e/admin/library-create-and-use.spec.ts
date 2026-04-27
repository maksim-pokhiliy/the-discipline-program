import { expect, test } from "@playwright/test";
import { type ExerciseLibraryItem, PrismaClient } from "@prisma/client";

import { evaluatePr } from "@repo/api-server/lms/pr-evaluator";

import {
  cleanupByIds,
  disconnectDb,
  insertWorkoutFlow,
  seedAthleteEnrollment,
  seedCoachPlan,
} from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];

const SYSTEM_EXERCISE_NAME = `E2E Pull Heavy ${Date.now().toString()}`;

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
});

test.describe("Library create-and-use seed-to-PR", () => {
  test("HEAD_COACH creates SYSTEM exercise; coach plan + log emits PR", async ({ page }) => {
    const createResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/library/exercises") &&
        res.request().method() === "POST" &&
        res.status() === 201,
    );

    await page.goto("/library/exercises/create");
    await expect(page.getByRole("heading", { name: "Create exercise" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel("Name").fill(SYSTEM_EXERCISE_NAME);

    await page.getByRole("combobox", { name: "Visibility" }).click();
    await page.getByRole("option", { name: "System", exact: true }).click();

    await page.getByLabel("Load", { exact: true }).check();
    await page.getByLabel("Reps", { exact: true }).check();

    await page.getByLabel("Demo video URL").fill("https://example.com/demo.mp4");
    await page.getByLabel("Demo image URL").fill("https://example.com/demo.png");

    await page.getByRole("button", { name: "Create exercise" }).click();

    const created = (await (await createResponsePromise).json()) as ExerciseLibraryItem;

    expect(created.id).toBeTruthy();
    expect(created.scope).toBe("SYSTEM");
    expect(created.name).toBe(SYSTEM_EXERCISE_NAME);
    cleanups.push({ table: "exerciseLibraryItem", id: created.id });

    await page.goto("/library/exercises");
    await page.getByPlaceholder("Search by name or alias...").fill(SYSTEM_EXERCISE_NAME);
    await expect(page.getByText(SYSTEM_EXERCISE_NAME).first()).toBeVisible({
      timeout: 30_000,
    });

    const prisma = new PrismaClient();

    try {
      const coachUser = await prisma.user.findUniqueOrThrow({
        where: { email: "coach@thedisciplineprogram.com" },
      });
      const athleteUser = await prisma.user.findUniqueOrThrow({
        where: { email: "tom.bradley@email.com" },
      });

      const planSeed = await seedCoachPlan({
        creatorId: coachUser.id,
        name: `E2E PR Plan ${Date.now().toString()}`,
      });

      cleanups.unshift({ table: "trainingPlan", id: planSeed.plan.id });

      const enrollment = await seedAthleteEnrollment({
        planId: planSeed.plan.id,
        athleteId: athleteUser.id,
      });

      const flow = await insertWorkoutFlow({
        athleteUserId: athleteUser.id,
        exerciseId: created.id,
        loadKg: 142.5,
        reps: 5,
        enrollmentId: enrollment.id,
      });

      cleanups.unshift({ table: "workoutSession", id: flow.workoutSessionId });

      const result = await evaluatePr({ db: prisma, setLogId: flow.setLog.id });

      expect(result.created).not.toBeNull();
      expect(result.created?.value.toString()).toBe("142.5");
      expect(result.created?.unit).toBe("kg");
      expect(result.created?.userId).toBe(athleteUser.id);
      expect(result.created?.exerciseId).toBe(created.id);
      const ctx = result.created?.context as { fixedReps?: number } | null;

      expect(ctx?.fixedReps).toBe(5);

      const persisted = await prisma.personalRecord.findUnique({
        where: {
          userId_exerciseId_kind: {
            userId: athleteUser.id,
            exerciseId: created.id,
            kind: "MAX_LOAD_FOR_REPS",
          },
        },
      });

      expect(persisted).not.toBeNull();
      expect(persisted?.value.toString()).toBe("142.5");

      await prisma.personalRecord.deleteMany({
        where: { userId: athleteUser.id, exerciseId: created.id },
      });
    } finally {
      await prisma.$disconnect();
    }
  });
});
