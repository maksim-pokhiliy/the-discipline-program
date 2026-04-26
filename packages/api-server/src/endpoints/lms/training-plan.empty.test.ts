import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  coachPlansPageDataSchema,
  getTrainingPlansResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { cleanup, cleanupRaw, createTestCoach, createTestPlan } from "../../test/helpers";

import { lmsTrainingPlanApi } from "./training-plan";

describe("lmsTrainingPlanApi — empty DB", () => {
  describe("getAll — coach with no plans", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      coach = await createTestCoach();
    });

    afterAll(async () => {
      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    });

    it("returns empty array for coach with no plans", async () => {
      const result = await lmsTrainingPlanApi.getAll(coach.user.id);

      expect(result).toEqual([]);
    });

    it("result validates against response schema", async () => {
      const result = await lmsTrainingPlanApi.getAll(coach.user.id);
      const parsed = getTrainingPlansResponseSchema.safeParse(result);

      expect(parsed.success).toBe(true);
    });
  });

  describe("getPageData — coach with a plan that has no enrollments", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;
    let plan: Awaited<ReturnType<typeof createTestPlan>>;

    beforeAll(async () => {
      coach = await createTestCoach();

      await cleanupRaw.user.update({
        where: { id: coach.user.id },
        data: { timezone: "UTC" },
      });

      plan = await createTestPlan(coach.user.id);
    });

    afterAll(async () => {
      await cleanup(
        { table: "trainingPlan", id: plan.id },
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    });

    it("returns plan with zeroed enrollment counter", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);
      const ourPlan = result.plans.find((p) => p.id === plan.id);

      if (!ourPlan) {
        throw new Error("Expected plan to be in results");
      }

      expect(ourPlan.enrolledAthletesCount).toBe(0);
    });

    it("page data validates against response schema", async () => {
      const result = await lmsTrainingPlanApi.getPageData(coach.user.id);
      const parsed = coachPlansPageDataSchema.safeParse(result);

      expect(parsed.success).toBe(true);
    });

    it("getById returns the plan shape without errors for a plan with no related rows", async () => {
      const result = await lmsTrainingPlanApi.getById(coach.user.id, plan.id);

      expect(result.id).toBe(plan.id);
      expect(result.creatorId).toBe(coach.user.id);
    });
  });
});
