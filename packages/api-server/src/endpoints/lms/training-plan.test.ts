import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanupRaw, createTestCoach } from "../../test/helpers";

import { lmsTrainingPlanApi } from "./training-plan";

describe("lmsTrainingPlanApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let coach2: Awaited<ReturnType<typeof createTestCoach>>;

  let planId: string;
  let workoutId: string;

  let coach2PlanId: string;
  let coach2WorkoutId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    coach2 = await createTestCoach();

    const plan = await cleanupRaw.trainingPlan.create({
      data: {
        coachId: coach.profile.id,
        name: "Original Plan",
        description: "Plan description",
        status: TrainingPlanStatus.ACTIVE,
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
        content: "A. Back Squat\n5x5 @ 185lb",
      },
    });

    workoutId = workout.id;

    await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: coach.user.id,
        status: PlanEnrollmentStatus.ACTIVE,
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
    await cleanupRaw.workout.deleteMany({ where: { planId } });
    await cleanupRaw.workout.deleteMany({ where: { planId: coach2PlanId } });

    const duplicatedPlans = await cleanupRaw.trainingPlan.findMany({
      where: { coachId: coach.profile.id, name: { startsWith: "Copy of" } },
    });

    for (const dp of duplicatedPlans) {
      await cleanupRaw.workout.deleteMany({ where: { planId: dp.id } });
      await cleanupRaw.trainingPlan.delete({ where: { id: dp.id } }).catch(() => {});
    }

    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: coach2PlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach2.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach2.user.id } }).catch(() => {});
  });

  describe("getPageData (indirectly tests getWeekBounds)", () => {
    it("returns workouts count for this week", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);

      const ourPlan = result.plans.find((p) => p.id === planId);

      expect(ourPlan).toBeDefined();
      expect(ourPlan?.workoutsThisWeek).toBe(1);
    });
  });

  describe("duplicate", () => {
    it("creates a copy with 'Copy of' prefix", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

      expect(copy.name).toBe("Copy of Original Plan");
    });

    it("new plan is DRAFT status regardless of source status", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

      expect(copy.status).toBe(TrainingPlanStatus.DRAFT);
    });

    it("copies all workouts with same dates, title, and content", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

      const copyWorkouts = await cleanupRaw.workout.findMany({
        where: { planId: copy.id, deletedAt: null },
      });

      expect(copyWorkouts).toHaveLength(1);

      const copiedWorkout = copyWorkouts[0];

      if (!copiedWorkout) {
        throw new Error("expected workout");
      }

      expect(copiedWorkout.title).toBe("Workout A");
      expect(copiedWorkout.content).toBe("A. Back Squat\n5x5 @ 185lb");
      expect(copiedWorkout.id).not.toBe(workoutId);
    });

    it("does NOT copy enrollments", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

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

      const workouts = await lmsTrainingPlanApi.getCalendarWeek(coach.user.id, weekStart);

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

      const workouts = await lmsTrainingPlanApi.getCalendarWeek(coach.user.id, weekStart);

      const coach2WorkoutFound = workouts.find((w) => w.id === coach2WorkoutId);

      expect(coach2WorkoutFound).toBeUndefined();
    });
  });
});
