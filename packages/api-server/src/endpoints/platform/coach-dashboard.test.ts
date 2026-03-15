import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coach-action-item";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/training-plan";

import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";
import { startOfTodayInTz, startOfWeekInTz } from "../../utils/date-helpers";

import { platformCoachDashboardApi } from "./coach-dashboard";

describe("platformCoachDashboardApi", () => {
  const TZ = "UTC";

  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let emptyCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete1: Awaited<ReturnType<typeof createTestUser>>;
  let athlete2: Awaited<ReturnType<typeof createTestUser>>;

  let activePlanId: string;
  let draftPlanId: string;

  const enrollmentIds: string[] = [];
  let workoutLogId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    emptyCoach = await createTestCoach();
    athlete1 = await createTestUser();
    athlete2 = await createTestUser();

    const activePlan = await cleanupRaw.trainingPlan.create({
      data: {
        coachId: coach.profile.id,
        name: "Active Plan",
        status: TrainingPlanStatus.ACTIVE,
      },
    });

    activePlanId = activePlan.id;

    const draftPlan = await cleanupRaw.trainingPlan.create({
      data: {
        coachId: coach.profile.id,
        name: "Draft Plan",
        status: TrainingPlanStatus.DRAFT,
      },
    });

    draftPlanId = draftPlan.id;

    const today = startOfTodayInTz(TZ);
    const weekStart = startOfWeekInTz(today, TZ);

    const wednesdayOffset = (() => {
      const todayDay = today.getUTCDay();

      if (todayDay === 3) {
        return 0;
      }

      const wed = 3;
      const diff = wed - (todayDay === 0 ? 7 : todayDay);

      return diff > 0 ? diff : diff + 7;
    })();

    const nonTodayWeekDay = new Date(weekStart);

    nonTodayWeekDay.setUTCDate(weekStart.getUTCDate() + wednesdayOffset);

    const isWednesdayToday = today.getUTCDay() === 3;

    const todayWorkout = await cleanupRaw.workout.create({
      data: {
        planId: activePlan.id,
        title: "Today Workout",
        scheduledDate: today,
        sortOrder: 0,
      },
    });

    let weekWorkoutDate: Date;

    if (isWednesdayToday) {
      const thursday = new Date(weekStart);

      thursday.setUTCDate(weekStart.getUTCDate() + 3);
      weekWorkoutDate = thursday;
    } else {
      weekWorkoutDate = nonTodayWeekDay;
    }

    await cleanupRaw.workout.create({
      data: {
        planId: activePlan.id,
        title: "Week Workout",
        scheduledDate: weekWorkoutDate,
        sortOrder: 1,
      },
    });

    const enrollment1 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: activePlan.id,
        userId: athlete1.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    enrollmentIds.push(enrollment1.id);

    const enrollment2 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: activePlan.id,
        userId: athlete2.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    enrollmentIds.push(enrollment2.id);

    const log = await cleanupRaw.workoutLog.create({
      data: {
        userId: athlete1.id,
        workoutId: todayWorkout.id,
        date: new Date(),
      },
    });

    workoutLogId = log.id;
  });

  afterAll(async () => {
    await cleanupRaw.workoutLog.delete({ where: { id: workoutLogId } }).catch(() => {});

    await cleanupRaw.coachActionItem.deleteMany({
      where: { coachId: coach.profile.id },
    });
    await cleanupRaw.coachActionItem.deleteMany({
      where: { coachId: emptyCoach.profile.id },
    });

    for (const eid of enrollmentIds) {
      await cleanupRaw.planEnrollment.delete({ where: { id: eid } }).catch(() => {});
    }

    await cleanupRaw.workout.deleteMany({ where: { planId: activePlanId } });
    await cleanupRaw.workout.deleteMany({ where: { planId: draftPlanId } });
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
      const result = await platformCoachDashboardApi.getDashboard(coach.user.id);

      expect(result.overview.totalActiveAthletes).toBe(2);
      expect(result.overview.activePlansCount).toBe(1);
    });

    it("counts workouts planned today and this week correctly", async () => {
      const result = await platformCoachDashboardApi.getDashboard(coach.user.id);

      expect(result.overview.workoutsPlannedToday).toBeGreaterThanOrEqual(2);
      expect(result.overview.workoutsPlannedThisWeek).toBeGreaterThanOrEqual(4);
      expect(result.overview.workoutsCompletedToday).toBeGreaterThanOrEqual(1);
    });

    it("returns sorted action items by type+severity priority", async () => {
      const result = await platformCoachDashboardApi.getDashboard(coach.user.id);

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
      const result = await platformCoachDashboardApi.getDashboard(emptyCoach.user.id);

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
