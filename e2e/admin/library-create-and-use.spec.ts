import { expect, test } from "@playwright/test";
import { type ExerciseLibraryItem, PrismaClient } from "@prisma/client";

import { evaluatePr } from "@repo/api-server/lms/pr-evaluator";

import {
  cleanupByIds,
  disconnectDb,
  insertWorkoutFlow,
  seedAthleteEnrollment,
  seedCoachPlan,
  seedSystemExercise,
} from "../helpers/database";

const cleanups: { table: string; id: string }[] = [];

const SYSTEM_EXERCISE_NAME = `E2EPullHeavy${Date.now().toString()}`;

test.afterAll(async () => {
  if (cleanups.length > 0) {
    await cleanupByIds(cleanups);
  }
  await disconnectDb();
});

test.describe("Library create-and-use seed-to-PR", () => {
  test("HEAD_COACH creates SYSTEM exercise; coach picks it via @ in editor; athlete log emits PR", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);

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

      const placeholderExercise = await seedSystemExercise({
        name: `E2E Placeholder ${Date.now().toString()}`,
      });

      cleanups.push({ table: "exerciseLibraryItem", id: placeholderExercise.id });

      const planSeed = await seedCoachPlan({
        creatorId: coachUser.id,
        name: `E2E PR Plan ${Date.now().toString()}`,
        withEntryFor: { exerciseId: placeholderExercise.id },
      });

      cleanups.unshift({ table: "trainingPlan", id: planSeed.plan.id });

      const seededEntryId = planSeed.entryId;

      expect(seededEntryId).not.toBeNull();
      if (!seededEntryId) {
        throw new Error("seedCoachPlan must return entryId when withEntryFor is set");
      }

      const platformContext = await browser.newContext({
        storageState: "e2e/.auth/platform-coach.json",
        baseURL: "http://localhost:3001",
      });
      const platformPage = await platformContext.newPage();

      try {
        const editorUrl = `/coach/plans/${planSeed.plan.id}?tab=schedule&selected=${encodeURIComponent(`entry:${seededEntryId}`)}`;

        const structurePromise = platformPage.waitForResponse(
          (res) =>
            res.url().includes(`/api/platform/training-plans/${planSeed.plan.id}/structure`) &&
            res.request().method() === "GET" &&
            res.status() === 200,
          { timeout: 60_000 },
        );

        await platformPage.goto(editorUrl);
        await structurePromise;

        await expect(platformPage.getByRole("heading", { name: "Inspector" })).toBeVisible({
          timeout: 60_000,
        });
        await expect(platformPage.getByText("Exercise entry")).toBeVisible({ timeout: 60_000 });

        const patchResponses: { url: string; status: number }[] = [];
        const patchBodies: { status: number; body: string }[] = [];

        platformPage.on("response", (res) => {
          if (
            res.url().includes(`/api/platform/training-plans/${planSeed.plan.id}/patch`) &&
            res.request().method() === "POST"
          ) {
            patchResponses.push({ url: res.url(), status: res.status() });
            void res
              .text()
              .then((body) => {
                patchBodies.push({ status: res.status(), body: body.slice(0, 500) });
              })
              .catch(() => undefined);
          }
        });

        const notesField = platformPage.getByLabel("Notes");

        await expect(notesField).toBeVisible({ timeout: 30_000 });
        await notesField.click();
        await notesField.fill("");
        await platformPage.keyboard.press("@");

        const listbox = platformPage.getByRole("listbox");

        await expect(listbox).toBeVisible({ timeout: 15_000 });

        await platformPage.keyboard.type(SYSTEM_EXERCISE_NAME, { delay: 25 });

        const option = listbox.getByText(SYSTEM_EXERCISE_NAME).first();

        await expect(option).toBeVisible({ timeout: 15_000 });

        await option.click();

        await expect
          .poll(() => patchResponses.length, {
            timeout: 30_000,
            message: () =>
              `expected at least one bulk-patch; got ${patchResponses.length.toString()} (statuses: ${patchResponses.map((r) => r.status.toString()).join(",")}). Bodies: ${JSON.stringify(patchBodies)}`,
          })
          .toBeGreaterThanOrEqual(1);

        const successPatches = patchResponses.filter((r) => r.status >= 200 && r.status < 300);

        expect(
          successPatches.length,
          `bodies seen: ${JSON.stringify(patchBodies)}`,
        ).toBeGreaterThanOrEqual(1);

        await expect(platformPage.getByText(/Saved/i).first()).toBeVisible({ timeout: 15_000 });
      } finally {
        await platformContext.close();
      }

      const persistedEntries = await prisma.exerciseEntry.findMany({
        where: {
          exerciseId: created.id,
          setGroupId: planSeed.setGroupId,
        },
      });

      expect(persistedEntries.length).toBeGreaterThanOrEqual(1);

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
