import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestUser,
} from "../test/helpers";

import { resolveCoachId, verifyAthleteBelongsToCoach, verifyPlanOwnership } from "./guards";

describe("platform guards", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let athleteUser: Awaited<ReturnType<typeof createTestUser>>;
  let nonEnrolledUser: Awaited<ReturnType<typeof createTestUser>>;
  let enrollmentId: string;
  let assignmentId: string;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherPlan: Awaited<ReturnType<typeof createTestPlan>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    regularUser = await createTestUser();
    athleteUser = await createTestUser();
    nonEnrolledUser = await createTestUser();

    plan = await createTestPlan(coach.profile.id);
    otherPlan = await createTestPlan(otherCoach.profile.id);

    const enrollment = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: athleteUser.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    enrollmentId = enrollment.id;

    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athleteUser.id },
    });

    assignmentId = assignment.id;
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachAthleteAssignment", id: assignmentId },
      { table: "planEnrollment", id: enrollmentId },
      { table: "trainingPlan", id: plan.id },
      { table: "trainingPlan", id: otherPlan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: otherCoach.user.id },
      { table: "user", id: regularUser.id },
      { table: "user", id: athleteUser.id },
      { table: "user", id: nonEnrolledUser.id },
    );
  });

  describe("resolveCoachId", () => {
    it("returns profile ID for valid coach user", async () => {
      const profileId = await resolveCoachId(coach.user.id);

      expect(profileId).toBe(coach.profile.id);
    });

    it("throws ForbiddenError for non-coach user", async () => {
      await expect(resolveCoachId(regularUser.id)).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError for deleted coach profile", async () => {
      await cleanupRaw.coachProfile.update({
        where: { id: otherCoach.profile.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(resolveCoachId(otherCoach.user.id)).rejects.toThrow(ForbiddenError);
      } finally {
        await cleanupRaw.coachProfile.update({
          where: { id: otherCoach.profile.id },
          data: { deletedAt: null },
        });
      }
    });
  });

  describe("verifyPlanOwnership", () => {
    it("does not throw when plan belongs to coach", async () => {
      await expect(verifyPlanOwnership(plan.id, coach.profile.id)).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when plan belongs to another coach", async () => {
      await expect(verifyPlanOwnership(plan.id, otherCoach.profile.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for deleted plan", async () => {
      await cleanupRaw.trainingPlan.update({
        where: { id: otherPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(verifyPlanOwnership(otherPlan.id, otherCoach.profile.id)).rejects.toThrow(
          NotFoundError,
        );
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: otherPlan.id },
          data: { deletedAt: null },
        });
      }
    });
  });

  describe("verifyAthleteBelongsToCoach", () => {
    it("does not throw for assigned athlete", async () => {
      await expect(
        verifyAthleteBelongsToCoach(athleteUser.id, coach.profile.id),
      ).resolves.toBeUndefined();
    });

    it("throws ForbiddenError for non-assigned athlete", async () => {
      await expect(
        verifyAthleteBelongsToCoach(nonEnrolledUser.id, coach.profile.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
