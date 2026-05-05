import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";
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
  let nonAssignedUser: Awaited<ReturnType<typeof createTestUser>>;
  let headCoachUser: Awaited<ReturnType<typeof createTestUser>>;
  let assignmentId: string;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherPlan: Awaited<ReturnType<typeof createTestPlan>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    regularUser = await createTestUser();
    athleteUser = await createTestUser();
    nonAssignedUser = await createTestUser();

    const preexisting = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    headCoachUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    plan = await createTestPlan(coach.user.id);
    otherPlan = await createTestPlan(otherCoach.user.id);

    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athleteUser.id },
    });

    assignmentId = assignment.id;
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachAthleteAssignment", id: assignmentId },
      { table: "trainingPlan", id: plan.id },
      { table: "trainingPlan", id: otherPlan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: otherCoach.user.id },
      { table: "user", id: regularUser.id },
      { table: "user", id: athleteUser.id },
      { table: "user", id: nonAssignedUser.id },
      { table: "user", id: headCoachUser.id },
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
    it("does not throw when plan was created by user", async () => {
      await expect(verifyPlanOwnership(plan.id, coach.user.id)).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when plan belongs to another coach", async () => {
      await expect(verifyPlanOwnership(plan.id, otherCoach.user.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("does not throw for HEAD_COACH on any plan", async () => {
      await expect(verifyPlanOwnership(plan.id, headCoachUser.id)).resolves.toBeUndefined();
    });

    it("does not throw for ADMIN on any plan", async () => {
      const adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      try {
        await expect(verifyPlanOwnership(plan.id, adminUser.id)).resolves.toBeUndefined();
      } finally {
        await cleanupRaw.user.delete({ where: { id: adminUser.id } });
      }
    });

    it("throws NotFoundError for soft-deleted plan", async () => {
      await cleanupRaw.trainingPlan.update({
        where: { id: otherPlan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(verifyPlanOwnership(otherPlan.id, otherCoach.user.id)).rejects.toThrow(
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
        verifyAthleteBelongsToCoach(nonAssignedUser.id, coach.profile.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
