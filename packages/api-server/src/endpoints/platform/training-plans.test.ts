import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TrainingPlanStatus } from "@repo/contracts/training-plan";

import { cleanupRaw, createTestCoach, createTestExercise } from "../../test/helpers";

import { platformTrainingPlansApi } from "./training-plans";

describe("platformTrainingPlansApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let coach2: Awaited<ReturnType<typeof createTestCoach>>;
  let category: Awaited<ReturnType<typeof cleanupRaw.exerciseCategory.create>>;
  let exercise: Awaited<ReturnType<typeof createTestExercise>>;

  let planId: string;
  let workoutId: string;
  let blockId: string;
  let setId: string;

  let coach2PlanId: string;
  let coach2WorkoutId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    coach2 = await createTestCoach();

    category = await cleanupRaw.exerciseCategory.create({
      data: { name: `Cat ${crypto.randomUUID().slice(0, 8)}` },
    });

    exercise = await createTestExercise({ categoryId: category.id });

    const plan = await cleanupRaw.trainingPlan.create({
      data: {
        coachId: coach.profile.id,
        name: "Original Plan",
        description: "Plan description",
        status: "ACTIVE",
      },
    });

    planId = plan.id;

    const now = new Date();
    const monday = new Date(now);
    const day = monday.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    monday.setUTCDate(monday.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const workout = await cleanupRaw.workout.create({
      data: {
        planId: plan.id,
        title: "Workout A",
        scheduledDate: monday,
        sortOrder: 0,
      },
    });

    workoutId = workout.id;

    const block = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId: workout.id,
        categoryId: category.id,
        rounds: 3,
        sortOrder: 0,
      },
    });

    blockId = block.id;

    const pSet = await cleanupRaw.prescribedSet.create({
      data: {
        blockId: block.id,
        exerciseId: exercise.id,
        sets: 3,
        reps: 10,
        sortOrder: 0,
      },
    });

    setId = pSet.id;

    await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: coach.user.id,
        status: "ACTIVE",
      },
    });

    const coach2Plan = await cleanupRaw.trainingPlan.create({
      data: {
        coachId: coach2.profile.id,
        name: "Coach2 Plan",
      },
    });

    coach2PlanId = coach2Plan.id;

    const coach2Workout = await cleanupRaw.workout.create({
      data: {
        planId: coach2Plan.id,
        title: "Coach2 Workout",
        scheduledDate: monday,
        sortOrder: 0,
      },
    });

    coach2WorkoutId = coach2Workout.id;
  });

  afterAll(async () => {
    await cleanupRaw.planEnrollment.deleteMany({ where: { trainingPlanId: planId } });
    await cleanupRaw.prescribedSet.deleteMany({ where: { blockId } });
    await cleanupRaw.workoutBlock.deleteMany({ where: { workoutId } });
    await cleanupRaw.workout.deleteMany({ where: { planId } });
    await cleanupRaw.workout.deleteMany({ where: { planId: coach2PlanId } });

    const duplicatedPlans = await cleanupRaw.trainingPlan.findMany({
      where: { coachId: coach.profile.id, name: { startsWith: "Copy of" } },
    });

    for (const dp of duplicatedPlans) {
      await cleanupRaw.prescribedSet.deleteMany({
        where: { block: { workout: { planId: dp.id } } },
      });
      await cleanupRaw.workoutBlock.deleteMany({
        where: { workout: { planId: dp.id } },
      });
      await cleanupRaw.workout.deleteMany({ where: { planId: dp.id } });
      await cleanupRaw.trainingPlan.delete({ where: { id: dp.id } }).catch(() => {});
    }

    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: coach2PlanId } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
    await cleanupRaw.exerciseCategory.delete({ where: { id: category.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach2.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach2.user.id } }).catch(() => {});
  });

  describe("getPageData (indirectly tests getWeekBounds)", () => {
    it("returns workouts count for this week", async () => {
      const result = await platformTrainingPlansApi.getPageData(coach.user.id);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);

      const ourPlan = result.plans.find((p) => p.id === planId);

      expect(ourPlan).toBeDefined();
      expect(ourPlan?.workoutsThisWeek).toBe(1);
    });
  });

  describe("duplicate", () => {
    it("creates a copy with 'Copy of' prefix", async () => {
      const copy = await platformTrainingPlansApi.duplicate(coach.user.id, planId);

      expect(copy.name).toBe("Copy of Original Plan");
    });

    it("new plan is DRAFT status regardless of source status", async () => {
      const copy = await platformTrainingPlansApi.duplicate(coach.user.id, planId);

      expect(copy.status).toBe(TrainingPlanStatus.DRAFT);
    });

    it("copies all workouts with same dates and title", async () => {
      const copy = await platformTrainingPlansApi.duplicate(coach.user.id, planId);

      const copyWorkouts = await cleanupRaw.workout.findMany({
        where: { planId: copy.id, deletedAt: null },
        include: { blocks: { include: { sets: true } } },
      });

      expect(copyWorkouts).toHaveLength(1);

      const copiedWorkout = copyWorkouts[0];

      if (!copiedWorkout) {
        throw new Error("expected workout");
      }

      expect(copiedWorkout.title).toBe("Workout A");
      expect(copiedWorkout.id).not.toBe(workoutId);
    });

    it("copies blocks and prescribed sets", async () => {
      const copy = await platformTrainingPlansApi.duplicate(coach.user.id, planId);

      const copyWorkouts = await cleanupRaw.workout.findMany({
        where: { planId: copy.id, deletedAt: null },
        include: { blocks: { include: { sets: true } } },
      });

      const copiedWorkout = copyWorkouts[0];

      if (!copiedWorkout) {
        throw new Error("expected workout");
      }

      expect(copiedWorkout.blocks).toHaveLength(1);

      const copiedBlock = copiedWorkout.blocks[0];

      if (!copiedBlock) {
        throw new Error("expected block");
      }

      expect(copiedBlock.rounds).toBe(3);
      expect(copiedBlock.categoryId).toBe(category.id);
      expect(copiedBlock.id).not.toBe(blockId);

      expect(copiedBlock.sets).toHaveLength(1);

      const copiedSet = copiedBlock.sets[0];

      if (!copiedSet) {
        throw new Error("expected set");
      }

      expect(copiedSet.exerciseId).toBe(exercise.id);
      expect(copiedSet.sets).toBe(3);
      expect(copiedSet.reps).toBe(10);
      expect(copiedSet.id).not.toBe(setId);
    });

    it("does NOT copy enrollments", async () => {
      const copy = await platformTrainingPlansApi.duplicate(coach.user.id, planId);

      const enrollments = await cleanupRaw.planEnrollment.findMany({
        where: { trainingPlanId: copy.id },
      });

      expect(enrollments).toHaveLength(0);
    });
  });

  describe("getCalendarWeek", () => {
    it("returns workouts within the given week range", async () => {
      const now = new Date();
      const day = now.getUTCDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday),
      );

      const workouts = await platformTrainingPlansApi.getCalendarWeek(coach.user.id, weekStart);

      expect(workouts.length).toBeGreaterThanOrEqual(1);

      const found = workouts.find((w) => w.id === workoutId);

      expect(found).toBeDefined();
      expect(found?.planName).toBe("Original Plan");
      expect(found?.planStatus).toBe(TrainingPlanStatus.ACTIVE);
    });

    it("excludes workouts from other coaches", async () => {
      const now = new Date();
      const day = now.getUTCDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday),
      );

      const workouts = await platformTrainingPlansApi.getCalendarWeek(coach.user.id, weekStart);

      const coach2WorkoutFound = workouts.find((w) => w.id === coach2WorkoutId);

      expect(coach2WorkoutFound).toBeUndefined();
    });
  });
});
