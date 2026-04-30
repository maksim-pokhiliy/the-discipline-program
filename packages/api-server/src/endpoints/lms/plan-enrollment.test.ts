import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanup, createTestCoach, createTestPlan, createTestUser } from "../../test/helpers";

import { lmsPlanEnrollmentApi } from "./plan-enrollment";

describe("lmsPlanEnrollmentApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let coach2: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let athlete2: Awaited<ReturnType<typeof createTestUser>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    coach2 = await createTestCoach();
    plan = await createTestPlan(coach.user.id);
    athlete = await createTestUser();
    athlete2 = await createTestUser();
    regularUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "coachProfile", id: coach2.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: coach2.user.id },
      { table: "user", id: athlete.id },
      { table: "user", id: athlete2.id },
      { table: "user", id: regularUser.id },
    );
  });

  describe("create", () => {
    it("creates enrollment for a valid athlete", async () => {
      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: athlete.id,
      });

      toCleanup.push({ table: "planEnrollment", id: enrollment.id });

      expect(enrollment.id).toBeDefined();
      expect(enrollment.planId).toBe(plan.id);
      expect(enrollment.userId).toBe(athlete.id);
      expect(enrollment.status).toBe(PlanEnrollmentStatus.ACTIVE);
    });

    it("creates enrollment with optional startedOnDate", async () => {
      const startedOnDate = new Date("2025-06-01T00:00:00Z");

      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: athlete2.id,
        startedOnDate,
      });

      toCleanup.push({ table: "planEnrollment", id: enrollment.id });

      expect(enrollment.startedOnDate.toISOString()).toBe(startedOnDate.toISOString());
    });

    it("throws ForbiddenError when coach does not own the plan", async () => {
      await expect(
        lmsPlanEnrollmentApi.create(coach2.user.id, plan.id, { userId: athlete.id }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError for non-existent target user", async () => {
      const fakeUserId = "cm000000000000000000fake0";

      await expect(
        lmsPlanEnrollmentApi.create(coach.user.id, plan.id, { userId: fakeUserId }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates enrollment status", async () => {
      const freshUser = await createTestUser();

      toCleanup.push({ table: "user", id: freshUser.id });

      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: freshUser.id,
      });

      toCleanup.push({ table: "planEnrollment", id: enrollment.id });

      const updated = await lmsPlanEnrollmentApi.update(coach.user.id, plan.id, enrollment.id, {
        status: PlanEnrollmentStatus.PAUSED,
      });

      expect(updated.status).toBe(PlanEnrollmentStatus.PAUSED);
      expect(updated.id).toBe(enrollment.id);
    });

    it("throws NotFoundError for non-existent enrollment", async () => {
      const fakeId = "cm000000000000000000fake1";

      await expect(
        lmsPlanEnrollmentApi.update(coach.user.id, plan.id, fakeId, {
          status: PlanEnrollmentStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when coach does not own the plan", async () => {
      const freshUser = await createTestUser();

      toCleanup.push({ table: "user", id: freshUser.id });

      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: freshUser.id,
      });

      toCleanup.push({ table: "planEnrollment", id: enrollment.id });

      await expect(
        lmsPlanEnrollmentApi.update(coach2.user.id, plan.id, enrollment.id, {
          status: PlanEnrollmentStatus.COMPLETED,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("deletes an existing enrollment", async () => {
      const freshUser = await createTestUser();

      toCleanup.push({ table: "user", id: freshUser.id });

      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: freshUser.id,
      });

      await lmsPlanEnrollmentApi.delete(coach.user.id, plan.id, enrollment.id);

      await expect(
        lmsPlanEnrollmentApi.update(coach.user.id, plan.id, enrollment.id, {
          status: PlanEnrollmentStatus.PAUSED,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError for non-existent enrollment", async () => {
      const fakeId = "cm000000000000000000fake2";

      await expect(lmsPlanEnrollmentApi.delete(coach.user.id, plan.id, fakeId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ForbiddenError when coach does not own the plan", async () => {
      const freshUser = await createTestUser();

      toCleanup.push({ table: "user", id: freshUser.id });

      const enrollment = await lmsPlanEnrollmentApi.create(coach.user.id, plan.id, {
        userId: freshUser.id,
      });

      toCleanup.push({ table: "planEnrollment", id: enrollment.id });

      await expect(
        lmsPlanEnrollmentApi.delete(coach2.user.id, plan.id, enrollment.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
