import { DayOfWeek, EnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { trainingPlanListItemSchema, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanupRaw, createTestCoach, createTestPlan, createTestUser } from "../../../test/helpers";
import {
  createTestDay,
  createTestEnrollment,
  createTestPerformedSession,
  createTestSession,
  createTestWeek,
} from "../../../test/schedule-helpers";

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

    describe("when the plan has live enrollments and logged history", () => {
      const removedAt = new Date("2025-01-01T00:00:00.000Z");

      let localCoach: Awaited<ReturnType<typeof createTestCoach>>;
      let enrolledAthlete: Awaited<ReturnType<typeof createTestUser>>;
      let removedAthlete: Awaited<ReturnType<typeof createTestUser>>;
      let localPlanId: string;
      let activeEnrollmentId: string;
      let removedEnrollmentId: string;
      let weekId: string;
      let dayId: string;
      let sessionId: string;
      let performedSessionId: string;

      beforeAll(async () => {
        localCoach = await createTestCoach();
        enrolledAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
        removedAthlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });

        const plan = await createTestPlan(localCoach.user.id, {
          status: TrainingPlanStatus.ACTIVE,
        });

        localPlanId = plan.id;

        const activeEnrollment = await createTestEnrollment(
          localPlanId,
          enrolledAthlete.id,
          localCoach.user.id,
        );

        activeEnrollmentId = activeEnrollment.enrollment.id;

        const removedEnrollment = await createTestEnrollment(
          localPlanId,
          removedAthlete.id,
          localCoach.user.id,
          { status: EnrollmentStatus.REMOVED },
        );

        removedEnrollmentId = removedEnrollment.enrollment.id;

        await cleanupRaw.planEnrollment.update({
          where: { id: removedEnrollmentId },
          data: { statusChangedAt: removedAt, deletedAt: removedAt },
        });

        const week = await createTestWeek(localPlanId, {
          startDate: new Date("2026-01-05T00:00:00.000Z"),
        });

        weekId = week.week.id;

        const day = await createTestDay(weekId, { dayOfWeek: DayOfWeek.MONDAY });

        dayId = day.day.id;

        const session = await createTestSession(dayId, { order: 0 });

        sessionId = session.session.id;

        const performed = await createTestPerformedSession(sessionId, enrolledAthlete.id);

        performedSessionId = performed.performed.id;

        await lmsTrainingPlanApi.delete(localCoach.user.id, localPlanId);
      });

      afterAll(async () => {
        await cleanupRaw.trainingPlan.delete({ where: { id: localPlanId } }).catch(() => {});
        await cleanupRaw.user.delete({ where: { id: enrolledAthlete.id } }).catch(() => {});
        await cleanupRaw.user.delete({ where: { id: removedAthlete.id } }).catch(() => {});
        await cleanupRaw.coachProfile
          .delete({ where: { id: localCoach.profile.id } })
          .catch(() => {});
        await cleanupRaw.user.delete({ where: { id: localCoach.user.id } }).catch(() => {});
      });

      it("marks the plan as soft-deleted", async () => {
        const row = await cleanupRaw.trainingPlan.findUnique({ where: { id: localPlanId } });

        expect(row?.deletedAt).not.toBeNull();
      });

      it("cascades live enrollments to REMOVED with deletedAt set", async () => {
        const row = await cleanupRaw.planEnrollment.findUnique({
          where: { id: activeEnrollmentId },
        });

        expect(row?.status).toBe(EnrollmentStatus.REMOVED);
        expect(row?.deletedAt).not.toBeNull();
      });

      it("leaves already-removed enrollment history untouched", async () => {
        const row = await cleanupRaw.planEnrollment.findUnique({
          where: { id: removedEnrollmentId },
        });

        expect(row?.statusChangedAt.getTime()).toBe(removedAt.getTime());
        expect(row?.deletedAt?.getTime()).toBe(removedAt.getTime());
      });

      it("preserves the logged athlete history chain under the plan", async () => {
        const performed = await cleanupRaw.performedSession.findUnique({
          where: { id: performedSessionId },
        });
        const session = await cleanupRaw.session.findUnique({ where: { id: sessionId } });
        const day = await cleanupRaw.day.findUnique({ where: { id: dayId } });
        const week = await cleanupRaw.week.findUnique({ where: { id: weekId } });

        expect(performed).not.toBeNull();
        expect(session).not.toBeNull();
        expect(day).not.toBeNull();
        expect(week).not.toBeNull();
      });

      it("excludes the soft-deleted plan from list endpoints", async () => {
        const all = await lmsTrainingPlanApi.getAll(localCoach.user.id);
        const page = await lmsTrainingPlanApi.getPageData(localCoach.user.id);

        expect(all.find((p) => p.id === localPlanId)).toBeUndefined();
        expect(page.plans.find((p) => p.id === localPlanId)).toBeUndefined();
      });

      it("throws NotFound for reads and mutations on the soft-deleted plan", async () => {
        await expect(lmsTrainingPlanApi.getById(localCoach.user.id, localPlanId)).rejects.toThrow(
          NotFoundError,
        );
        await expect(
          lmsTrainingPlanApi.update(localCoach.user.id, localPlanId, { name: "Renamed" }),
        ).rejects.toThrow(NotFoundError);
        await expect(lmsTrainingPlanApi.delete(localCoach.user.id, localPlanId)).rejects.toThrow(
          NotFoundError,
        );
        await expect(lmsTrainingPlanApi.archive(localCoach.user.id, localPlanId)).rejects.toThrow(
          NotFoundError,
        );
      });
    });
  });
});
