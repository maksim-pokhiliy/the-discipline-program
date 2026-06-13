import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";
import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestUser,
} from "../test/helpers";

import {
  resolveCoachId,
  verifyAthleteBelongsToCoach,
  verifyBlockOwnership,
  verifyPlanOwnership,
  verifySchemaOwnership,
  verifySchemaRowOwnership,
} from "./guards";

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
      await expect(verifyPlanOwnership(plan.id, coach.user.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
      });
    });

    it("throws ForbiddenError when plan belongs to another coach", async () => {
      await expect(verifyPlanOwnership(plan.id, otherCoach.user.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("does not throw for HEAD_COACH on any plan", async () => {
      await expect(verifyPlanOwnership(plan.id, headCoachUser.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
      });
    });

    it("does not throw for ADMIN on any plan", async () => {
      const adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      try {
        await expect(verifyPlanOwnership(plan.id, adminUser.id)).resolves.toEqual({
          status: TrainingPlanStatus.DRAFT,
        });
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

  describe("verifyBlockOwnership", () => {
    let weekId: string;
    let dayId: string;
    let sessionId: string;
    let blockId: string;

    beforeAll(async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: plan.id, startDate: new Date(Date.UTC(2026, 4, 18)) },
      });

      weekId = week.id;

      const day = await cleanupRaw.day.create({
        data: { weekId, dayOfWeek: "TUESDAY" },
      });

      dayId = day.id;

      const session = await cleanupRaw.session.create({
        data: { dayId, order: 10 },
      });

      sessionId = session.id;

      const block = await cleanupRaw.block.create({
        data: { sessionId, order: 10 },
      });

      blockId = block.id;
    });

    afterAll(async () => {
      await cleanupRaw.block.delete({ where: { id: blockId } }).catch(() => {});
      await cleanupRaw.session.delete({ where: { id: sessionId } }).catch(() => {});
      await cleanupRaw.day.delete({ where: { id: dayId } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: weekId } }).catch(() => {});
    });

    it("returns chain ids and status for the plan creator", async () => {
      await expect(verifyBlockOwnership(blockId, coach.user.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("throws ForbiddenError for an unrelated coach", async () => {
      await expect(verifyBlockOwnership(blockId, otherCoach.user.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("returns chain ids and status for a HEAD_COACH bypass", async () => {
      await expect(verifyBlockOwnership(blockId, headCoachUser.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("throws NotFoundError when block does not exist", async () => {
      await expect(
        verifyBlockOwnership("clz0000000000000000000000", coach.user.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("verifySchemaOwnership", () => {
    let weekId: string;
    let dayId: string;
    let sessionId: string;
    let blockId: string;
    let schemaId: string;

    beforeAll(async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: plan.id, startDate: new Date(Date.UTC(2026, 4, 25)) },
      });

      weekId = week.id;

      const day = await cleanupRaw.day.create({
        data: { weekId, dayOfWeek: "WEDNESDAY" },
      });

      dayId = day.id;

      const session = await cleanupRaw.session.create({
        data: { dayId, order: 10 },
      });

      sessionId = session.id;

      const block = await cleanupRaw.block.create({
        data: { sessionId, order: 10 },
      });

      blockId = block.id;

      const schema = await cleanupRaw.schema.create({
        data: {
          blockId,
          order: 10,
        },
      });

      schemaId = schema.id;
    });

    afterAll(async () => {
      await cleanupRaw.schema.delete({ where: { id: schemaId } }).catch(() => {});
      await cleanupRaw.block.delete({ where: { id: blockId } }).catch(() => {});
      await cleanupRaw.session.delete({ where: { id: sessionId } }).catch(() => {});
      await cleanupRaw.day.delete({ where: { id: dayId } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: weekId } }).catch(() => {});
    });

    it("returns chain ids and status for the plan creator", async () => {
      await expect(verifySchemaOwnership(schemaId, coach.user.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        blockId,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("throws ForbiddenError for an unrelated coach", async () => {
      await expect(verifySchemaOwnership(schemaId, otherCoach.user.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("returns chain ids and status for a HEAD_COACH bypass", async () => {
      await expect(verifySchemaOwnership(schemaId, headCoachUser.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        blockId,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("throws NotFoundError when schema does not exist", async () => {
      await expect(
        verifySchemaOwnership("clz0000000000000000000000", coach.user.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("verifySchemaRowOwnership", () => {
    let weekId: string;
    let dayId: string;
    let sessionId: string;
    let blockId: string;
    let schemaId: string;
    let schemaRowId: string;

    beforeAll(async () => {
      const week = await cleanupRaw.week.create({
        data: { planId: plan.id, startDate: new Date(Date.UTC(2026, 5, 1)) },
      });

      weekId = week.id;

      const day = await cleanupRaw.day.create({
        data: { weekId, dayOfWeek: "THURSDAY" },
      });

      dayId = day.id;

      const session = await cleanupRaw.session.create({
        data: { dayId, order: 10 },
      });

      sessionId = session.id;

      const block = await cleanupRaw.block.create({
        data: { sessionId, order: 10 },
      });

      blockId = block.id;

      const schema = await cleanupRaw.schema.create({
        data: {
          blockId,
          order: 10,
        },
      });

      schemaId = schema.id;

      const schemaRow = await cleanupRaw.schemaRow.create({
        data: {
          schemaId,
          order: 10,
          exerciseId: "clz0000000000000000guardex",
        },
      });

      schemaRowId = schemaRow.id;
    });

    afterAll(async () => {
      await cleanupRaw.schemaRow.delete({ where: { id: schemaRowId } }).catch(() => {});
      await cleanupRaw.schema.delete({ where: { id: schemaId } }).catch(() => {});
      await cleanupRaw.block.delete({ where: { id: blockId } }).catch(() => {});
      await cleanupRaw.session.delete({ where: { id: sessionId } }).catch(() => {});
      await cleanupRaw.day.delete({ where: { id: dayId } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: weekId } }).catch(() => {});
    });

    it("returns chain ids and status for the plan creator", async () => {
      await expect(verifySchemaRowOwnership(schemaRowId, coach.user.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        schemaId,
        blockId,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("returns chain ids and status for a HEAD_COACH bypass", async () => {
      await expect(verifySchemaRowOwnership(schemaRowId, headCoachUser.id)).resolves.toEqual({
        status: TrainingPlanStatus.DRAFT,
        schemaId,
        blockId,
        sessionId,
        dayId,
        weekId,
        planId: plan.id,
      });
    });

    it("throws ForbiddenError for an unrelated coach", async () => {
      await expect(verifySchemaRowOwnership(schemaRowId, otherCoach.user.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError when schema row does not exist", async () => {
      await expect(
        verifySchemaRowOwnership("clz0000000000000000000000", coach.user.id),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when parent plan is soft-deleted", async () => {
      await cleanupRaw.trainingPlan.update({
        where: { id: plan.id },
        data: { deletedAt: new Date() },
      });

      try {
        await expect(verifySchemaRowOwnership(schemaRowId, coach.user.id)).rejects.toThrow(
          NotFoundError,
        );
      } finally {
        await cleanupRaw.trainingPlan.update({
          where: { id: plan.id },
          data: { deletedAt: null },
        });
      }
    });
  });
});
