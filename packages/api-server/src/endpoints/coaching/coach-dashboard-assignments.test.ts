import { afterEach, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";
import { startOfTodayInTz } from "../../utils/date-helpers";

import { coachingCoachDashboardApi } from "./coach-dashboard";

describe("coachingCoachDashboardApi — assignment-keyed counts", () => {
  const TZ = "UTC";
  const createdCoachProfileIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdPlanIds: string[] = [];

  const trackCoach = async () => {
    const coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { timezone: TZ },
    });

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    return coach;
  };

  const trackUser = async () => {
    const user = await createTestUser();

    createdUserIds.push(user.id);

    return user;
  };

  const trackPlan = async (coachProfileId: string, status: TrainingPlanStatus, name: string) => {
    const plan = await cleanupRaw.trainingPlan.create({
      data: { coachId: coachProfileId, name, status },
    });

    createdPlanIds.push(plan.id);

    return plan;
  };

  afterEach(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.coachAthleteAssignment
      .deleteMany({ where: { coachId: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.planEnrollment
      .deleteMany({ where: { trainingPlanId: { in: createdPlanIds } } })
      .catch(() => {});
    await cleanupRaw.workout
      .deleteMany({ where: { planId: { in: createdPlanIds } } })
      .catch(() => {});
    await cleanupRaw.trainingPlan
      .deleteMany({ where: { id: { in: createdPlanIds } } })
      .catch(() => {});
    await cleanupRaw.coachProfile
      .deleteMany({ where: { id: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});

    createdCoachProfileIds.length = 0;
    createdUserIds.length = 0;
    createdPlanIds.length = 0;
  });

  it("totalActiveAthletes counts assigned athletes independent of enrollment state", async () => {
    const coach = await trackCoach();
    const a1 = await trackUser();
    const a2 = await trackUser();
    const a3 = await trackUser();

    const plan = await trackPlan(coach.profile.id, TrainingPlanStatus.ACTIVE, "Assigned Plan");

    await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: a1.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    await cleanupRaw.coachAthleteAssignment.createMany({
      data: [
        { coachId: coach.profile.id, athleteId: a1.id },
        { coachId: coach.profile.id, athleteId: a2.id },
        { coachId: coach.profile.id, athleteId: a3.id },
      ],
    });

    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.totalActiveAthletes).toBe(3);
    expect(result.athletesSummary).toHaveLength(3);
  });

  it("does not count workouts from DRAFT plans in workoutsPlannedToday/ThisWeek", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();
    const today = startOfTodayInTz(TZ);

    const draftPlan = await trackPlan(coach.profile.id, TrainingPlanStatus.DRAFT, "Draft Plan");

    await cleanupRaw.workout.create({
      data: {
        planId: draftPlan.id,
        title: "Draft Today Workout",
        scheduledDate: today,
        sortOrder: 0,
      },
    });

    await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: draftPlan.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.workoutsPlannedToday).toBe(0);
    expect(result.overview.workoutsPlannedThisWeek).toBe(0);
    expect(result.overview.activePlansCount).toBe(0);
  });

  it("counts workouts only from ACTIVE plans", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();
    const today = startOfTodayInTz(TZ);

    const activePlan = await trackPlan(coach.profile.id, TrainingPlanStatus.ACTIVE, "Active Plan");

    await cleanupRaw.workout.create({
      data: {
        planId: activePlan.id,
        title: "Active Today Workout",
        scheduledDate: today,
        sortOrder: 0,
      },
    });

    await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: activePlan.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.workoutsPlannedToday).toBeGreaterThanOrEqual(1);
    expect(result.overview.workoutsPlannedThisWeek).toBeGreaterThanOrEqual(1);
    expect(result.overview.activePlansCount).toBe(1);
  });
});
