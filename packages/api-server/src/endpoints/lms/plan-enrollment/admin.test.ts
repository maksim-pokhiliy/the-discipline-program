import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { BadRequestError, ConflictError, ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanupRaw,
  createTestAssignment,
  createTestCoach,
  createTestUser,
} from "../../../test/helpers";

import { lmsPlanEnrollmentApi } from "./admin";

const baseEnrollmentData = (athleteId: string) => ({
  planId: "ignored-by-service",
  athleteId,
  boardedAt: new Date("2026-01-01"),
});

describe("lmsPlanEnrollmentApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestUser>>;

  let assignedAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let unassignedAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let coachUserAsAthlete: Awaited<ReturnType<typeof createTestUser>>;

  let assignmentId: string;

  let activePlanId: string;
  let draftPlanId: string;
  let archivedPlanId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    assignedAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
    unassignedAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
    coachUserAsAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });

    const assignment = await createTestAssignment(coach.profile.id, assignedAthlete.id);

    assignmentId = assignment.id;

    const activePlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Active Plan", status: "ACTIVE" },
    });

    activePlanId = activePlan.id;

    const draftPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Draft Plan", status: "DRAFT" },
    });

    draftPlanId = draftPlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Archived Plan", status: "ARCHIVED" },
    });

    archivedPlanId = archivedPlan.id;
  });

  afterAll(async () => {
    await cleanupRaw.planEnrollment
      .deleteMany({ where: { planId: { in: [activePlanId, draftPlanId, archivedPlanId] } } })
      .catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: draftPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.coachAthleteAssignment.delete({ where: { id: assignmentId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: assignedAthlete.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: unassignedAthlete.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachUserAsAthlete.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: headCoach.id } }).catch(() => {});
  });

  describe("listByPlan", () => {
    it("rejects when caller does not own the plan and is not admin/head-coach", async () => {
      await expect(
        lmsPlanEnrollmentApi.listByPlan(otherCoach.user.id, activePlanId, {}),
      ).rejects.toThrow(ForbiddenError);
    });

    it("excludes soft-removed rows by default and includes them when status=REMOVED", async () => {
      const liveRow = await cleanupRaw.planEnrollment.create({
        data: {
          planId: activePlanId,
          athleteId: assignedAthlete.id,
          enrolledById: coach.user.id,
          boardedAt: new Date("2026-01-01"),
          status: "ACTIVE",
        },
      });
      const removedRow = await cleanupRaw.planEnrollment.create({
        data: {
          planId: activePlanId,
          athleteId: unassignedAthlete.id,
          enrolledById: coach.user.id,
          boardedAt: new Date("2026-01-01"),
          status: "REMOVED",
          deletedAt: new Date(),
        },
      });

      try {
        const defaultList = await lmsPlanEnrollmentApi.listByPlan(coach.user.id, activePlanId, {});
        const removedList = await lmsPlanEnrollmentApi.listByPlan(coach.user.id, activePlanId, {
          status: EnrollmentStatus.REMOVED,
        });

        expect(defaultList.find((e) => e.id === liveRow.id)).toBeDefined();
        expect(defaultList.find((e) => e.id === removedRow.id)).toBeUndefined();
        expect(removedList.find((e) => e.id === removedRow.id)).toBeDefined();
        expect(removedList.find((e) => e.id === liveRow.id)).toBeUndefined();
      } finally {
        await cleanupRaw.planEnrollment.delete({ where: { id: liveRow.id } }).catch(() => {});
        await cleanupRaw.planEnrollment.delete({ where: { id: removedRow.id } }).catch(() => {});
      }
    });
  });

  describe("create", () => {
    it("rejects on DRAFT plan with ConflictError", async () => {
      await expect(
        lmsPlanEnrollmentApi.create(
          coach.user.id,
          draftPlanId,
          baseEnrollmentData(assignedAthlete.id),
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("rejects on ARCHIVED plan with ConflictError", async () => {
      await expect(
        lmsPlanEnrollmentApi.create(
          coach.user.id,
          archivedPlanId,
          baseEnrollmentData(assignedAthlete.id),
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("rejects when athleteId references a non-ATHLETE user with BadRequestError", async () => {
      await expect(
        lmsPlanEnrollmentApi.create(
          coach.user.id,
          activePlanId,
          baseEnrollmentData(coachUserAsAthlete.id),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("rejects regular COACH enrolling unassigned athlete with ForbiddenError", async () => {
      await expect(
        lmsPlanEnrollmentApi.create(
          coach.user.id,
          activePlanId,
          baseEnrollmentData(unassignedAthlete.id),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows HEAD_COACH to enroll any athlete without coach-athlete assignment", async () => {
      const created = await lmsPlanEnrollmentApi.create(
        headCoach.id,
        activePlanId,
        baseEnrollmentData(unassignedAthlete.id),
      );

      try {
        expect(created.id).toBeDefined();
        expect(created.planId).toBe(activePlanId);
        expect(created.athleteId).toBe(unassignedAthlete.id);
        expect(created.enrolledById).toBe(headCoach.id);
        expect(created.status).toBe(EnrollmentStatus.ACTIVE);
      } finally {
        await cleanupRaw.planEnrollment.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });

  describe("status transitions", () => {
    it("pauses ACTIVE → PAUSED, resumes PAUSED → ACTIVE, and rejects pause-on-PAUSED", async () => {
      const created = await lmsPlanEnrollmentApi.create(
        coach.user.id,
        activePlanId,
        baseEnrollmentData(assignedAthlete.id),
      );

      try {
        const paused = await lmsPlanEnrollmentApi.pause(coach.user.id, activePlanId, created.id);

        expect(paused.status).toBe(EnrollmentStatus.PAUSED);

        await expect(
          lmsPlanEnrollmentApi.pause(coach.user.id, activePlanId, created.id),
        ).rejects.toThrow(ConflictError);

        const resumed = await lmsPlanEnrollmentApi.resume(coach.user.id, activePlanId, created.id);

        expect(resumed.status).toBe(EnrollmentStatus.ACTIVE);
      } finally {
        await cleanupRaw.planEnrollment.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });

  describe("remove", () => {
    it("soft-removes via update (status=REMOVED, deletedAt set) and is idempotent on second call", async () => {
      const created = await lmsPlanEnrollmentApi.create(
        coach.user.id,
        activePlanId,
        baseEnrollmentData(assignedAthlete.id),
      );

      try {
        await lmsPlanEnrollmentApi.remove(coach.user.id, activePlanId, created.id);

        const afterFirst = await cleanupRaw.planEnrollment.findUnique({
          where: { id: created.id },
        });

        expect(afterFirst).not.toBeNull();
        expect(afterFirst?.status).toBe("REMOVED");
        expect(afterFirst?.deletedAt).toBeInstanceOf(Date);

        await expect(
          lmsPlanEnrollmentApi.remove(coach.user.id, activePlanId, created.id),
        ).resolves.toBeUndefined();
      } finally {
        await cleanupRaw.planEnrollment.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });
});
