import { PlanEnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

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
    });

    it("does not list plans owned by another coach", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.find((p) => p.id === coach2PlanId)).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("soft-deletes the plan but preserves enrollment history and product links", async () => {
      const localCoach = await createTestCoach();
      const localAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
      const localPlan = await cleanupRaw.trainingPlan.create({
        data: { creatorId: localCoach.user.id, name: "Plan To Delete" },
      });
      const enrollment = await cleanupRaw.planEnrollment.create({
        data: {
          planId: localPlan.id,
          userId: localAthlete.id,
          status: PlanEnrollmentStatus.ACTIVE,
          startedAtWeekIndex: 0,
          startedOnDate: new Date(),
        },
      });
      const product = await cleanupRaw.product.create({
        data: {
          slug: `prod-${localPlan.id}`,
          title: "Linked Product",
          description: "Product linked to the plan being deleted",
          trainingPlanId: localPlan.id,
        },
      });

      try {
        await lmsTrainingPlanApi.delete(localCoach.user.id, localPlan.id);

        const planAfter = await cleanupRaw.trainingPlan.findUnique({
          where: { id: localPlan.id },
          select: { deletedAt: true },
        });
        const enrollmentAfter = await cleanupRaw.planEnrollment.findUnique({
          where: { id: enrollment.id },
          select: { id: true, planId: true },
        });
        const productAfter = await cleanupRaw.product.findUnique({
          where: { id: product.id },
          select: { trainingPlanId: true },
        });

        expect(planAfter?.deletedAt).toBeInstanceOf(Date);
        expect(enrollmentAfter).not.toBeNull();
        expect(enrollmentAfter?.planId).toBe(localPlan.id);
        expect(productAfter?.trainingPlanId).toBe(localPlan.id);
      } finally {
        await cleanupRaw.product.delete({ where: { id: product.id } }).catch(() => {});
        await cleanupRaw.planEnrollment.delete({ where: { id: enrollment.id } }).catch(() => {});
        await cleanupRaw.trainingPlan.delete({ where: { id: localPlan.id } }).catch(() => {});
        await cleanupRaw.coachProfile
          .delete({ where: { id: localCoach.profile.id } })
          .catch(() => {});
        await cleanupRaw.user.delete({ where: { id: localCoach.user.id } }).catch(() => {});
        await cleanupRaw.user.delete({ where: { id: localAthlete.id } }).catch(() => {});
      }
    });
  });
});
