import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { trainingPlanListItemSchema, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

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

    const coach2Plan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach2.user.id,
        name: "Coach2 Plan",
      },
    });

    coach2PlanId = coach2Plan.id;
  });

  afterAll(async () => {
    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: coach2PlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach2.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach2.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  describe("getPageData", () => {
    it("returns plans visible to the creator and matches list-item schema", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);

      const ourPlan = result.plans.find((p) => p.id === planId);

      expect(ourPlan).toBeDefined();

      const parsed = trainingPlanListItemSchema.safeParse(ourPlan);

      expect(parsed.success).toBe(true);
    });

    it("does not list plans owned by another coach", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);

      expect(result.plans.find((p) => p.id === coach2PlanId)).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("soft-deletes the plan and hides it from list endpoints", async () => {
      const localCoach = await createTestCoach();
      const localPlan = await cleanupRaw.trainingPlan.create({
        data: { creatorId: localCoach.user.id, name: "Plan To Delete" },
      });

      try {
        await lmsTrainingPlanApi.delete(localCoach.user.id, localPlan.id);

        const after = await lmsTrainingPlanApi.getAll(localCoach.user.id);

        expect(after.find((p) => p.id === localPlan.id)).toBeUndefined();
      } finally {
        await cleanupRaw.trainingPlan.delete({ where: { id: localPlan.id } }).catch(() => {});
        await cleanupRaw.coachProfile
          .delete({ where: { id: localCoach.profile.id } })
          .catch(() => {});
        await cleanupRaw.user.delete({ where: { id: localCoach.user.id } }).catch(() => {});
      }
    });
  });
});
