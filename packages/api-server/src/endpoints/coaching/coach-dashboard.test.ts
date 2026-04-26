import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { coachingCoachDashboardApi } from "./coach-dashboard";

describe("coachingCoachDashboardApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let emptyCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete1: Awaited<ReturnType<typeof createTestUser>>;
  let athlete2: Awaited<ReturnType<typeof createTestUser>>;

  let activePlanId: string;
  let draftPlanId: string;

  const enrollmentIds: string[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    emptyCoach = await createTestCoach();
    athlete1 = await createTestUser();
    athlete2 = await createTestUser();

    const activePlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Active Plan",
        status: TrainingPlanStatus.ACTIVE,
      },
    });

    activePlanId = activePlan.id;

    const draftPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Draft Plan",
        status: TrainingPlanStatus.DRAFT,
      },
    });

    draftPlanId = draftPlan.id;

    const enrollment1 = await cleanupRaw.planEnrollment.create({
      data: {
        planId: activePlan.id,
        userId: athlete1.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    enrollmentIds.push(enrollment1.id);

    const enrollment2 = await cleanupRaw.planEnrollment.create({
      data: {
        planId: activePlan.id,
        userId: athlete2.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    enrollmentIds.push(enrollment2.id);

    await cleanupRaw.coachAthleteAssignment.createMany({
      data: [
        { coachId: coach.profile.id, athleteId: athlete1.id },
        { coachId: coach.profile.id, athleteId: athlete2.id },
      ],
    });
  });

  afterAll(async () => {
    await cleanupRaw.coachActionItem.deleteMany({
      where: { coachId: coach.profile.id },
    });
    await cleanupRaw.coachActionItem.deleteMany({
      where: { coachId: emptyCoach.profile.id },
    });
    await cleanupRaw.coachAthleteAssignment.deleteMany({
      where: { coachId: coach.profile.id },
    });

    for (const eid of enrollmentIds) {
      await cleanupRaw.planEnrollment.delete({ where: { id: eid } }).catch(() => {});
    }

    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: draftPlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: emptyCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: emptyCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete1.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete2.id } }).catch(() => {});
  });

  describe("getDashboard", () => {
    it("returns correct overview stats", async () => {
      const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

      expect(result.overview.totalActiveAthletes).toBe(2);
      expect(result.overview.activePlansCount).toBe(1);
    });

    it("workout counters return zero (workout logging removed in M0)", async () => {
      const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

      expect(result.overview.workoutsPlannedToday).toBe(0);
      expect(result.overview.workoutsPlannedThisWeek).toBe(0);
      expect(result.overview.workoutsCompletedToday).toBe(0);
      expect(result.overview.workoutsCompletedThisWeek).toBe(0);
    });

    it("returns sorted action items by type+severity priority", async () => {
      const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

      if (result.actionItems.length >= 2) {
        for (let i = 0; i < result.actionItems.length - 1; i++) {
          const a = result.actionItems[i];
          const b = result.actionItems[i + 1];

          if (!a || !b) {
            continue;
          }

          const aTypePriority =
            a.type === ActionItemType.HEALTH_REPORT
              ? 0
              : a.type === ActionItemType.MISSED_WORKOUTS
                ? 1
                : 2;
          const bTypePriority =
            b.type === ActionItemType.HEALTH_REPORT
              ? 0
              : b.type === ActionItemType.MISSED_WORKOUTS
                ? 1
                : 2;

          const aSeverityPriority =
            a.severity === ActionItemSeverity.CRITICAL
              ? 0
              : a.severity === ActionItemSeverity.WARNING
                ? 1
                : 2;
          const bSeverityPriority =
            b.severity === ActionItemSeverity.CRITICAL
              ? 0
              : b.severity === ActionItemSeverity.WARNING
                ? 1
                : 2;

          const sortValue = aTypePriority - bTypePriority || aSeverityPriority - bSeverityPriority;

          expect(sortValue).toBeLessThanOrEqual(0);
        }
      }
    });

    it("handles coach with no enrollments (empty state)", async () => {
      const result = await coachingCoachDashboardApi.getDashboard(emptyCoach.user.id);

      expect(result.overview.totalActiveAthletes).toBe(0);
      expect(result.overview.activePlansCount).toBe(0);
      expect(result.overview.workoutsPlannedToday).toBe(0);
      expect(result.overview.workoutsPlannedThisWeek).toBe(0);
      expect(result.overview.workoutsCompletedToday).toBe(0);
      expect(result.overview.workoutsCompletedThisWeek).toBe(0);
      expect(result.overview.openActionItemsCount).toBe(0);
      expect(result.actionItems).toHaveLength(0);
      expect(result.athletesSummary).toHaveLength(0);
    });
  });
});
