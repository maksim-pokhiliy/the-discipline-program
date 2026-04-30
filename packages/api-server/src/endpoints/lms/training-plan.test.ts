import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { lmsTrainingPlanApi } from "./training-plan";

describe("lmsTrainingPlanApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let coach2: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;

  let planId: string;
  let coach2PlanId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    coach2 = await createTestCoach();
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });

    const plan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Original Plan",
        description: "Plan description",
        status: TrainingPlanStatus.ACTIVE,
      },
    });

    planId = plan.id;

    await cleanupRaw.planEnrollment.create({
      data: {
        planId: plan.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    const coach2Plan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach2.user.id,
        name: "Coach2 Plan",
      },
    });

    coach2PlanId = coach2Plan.id;
  });

  afterAll(async () => {
    await cleanupRaw.planEnrollment.deleteMany({ where: { planId } });

    const duplicatedPlans = await cleanupRaw.trainingPlan.findMany({
      where: { creatorId: coach.user.id, name: { startsWith: "Copy of" } },
    });

    for (const dp of duplicatedPlans) {
      await cleanupRaw.trainingPlan.delete({ where: { id: dp.id } }).catch(() => {});
    }

    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: coach2PlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach2.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach2.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  describe("getPageData", () => {
    it("returns plans visible to the creator with enrolled count", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);

      const ourPlan = result.plans.find((p) => p.id === planId);

      expect(ourPlan).toBeDefined();
      expect(ourPlan?.enrolledAthletesCount).toBe(1);
    });

    it("does not list plans owned by another coach", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.find((p) => p.id === coach2PlanId)).toBeUndefined();
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

    it("references the source plan via originalPlanId", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

      expect(copy.originalPlanId).toBe(planId);
    });

    it("does NOT copy enrollments", async () => {
      const copy = await lmsTrainingPlanApi.duplicate(coach.user.id, planId);

      const enrollments = await cleanupRaw.planEnrollment.findMany({
        where: { planId: copy.id },
      });

      expect(enrollments).toHaveLength(0);
    });
  });
});
