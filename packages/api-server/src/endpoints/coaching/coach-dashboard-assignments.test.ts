import { afterEach, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

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

  const trackPlan = async (creatorUserId: string, status: TrainingPlanStatus, name: string) => {
    const plan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: creatorUserId, name, status },
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

    const plan = await trackPlan(coach.user.id, TrainingPlanStatus.ACTIVE, "Assigned Plan");

    await cleanupRaw.planEnrollment.create({
      data: {
        planId: plan.id,
        userId: a1.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
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

  it("activePlansCount excludes DRAFT plans", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();

    const draftPlan = await trackPlan(coach.user.id, TrainingPlanStatus.DRAFT, "Draft Plan");

    await cleanupRaw.planEnrollment.create({
      data: {
        planId: draftPlan.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.activePlansCount).toBe(0);
  });

  it("counts ACTIVE plans only", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();

    const activePlan = await trackPlan(coach.user.id, TrainingPlanStatus.ACTIVE, "Active Plan");

    await cleanupRaw.planEnrollment.create({
      data: {
        planId: activePlan.id,
        userId: athlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.activePlansCount).toBe(1);
  });
});
