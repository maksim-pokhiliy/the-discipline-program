import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestEnrollment,
  createTestPlan,
  createTestScenario,
  createTestUser,
  createTestWorkoutSession,
  type TestScenario,
} from "../../../test/helpers";

import { coachingCoachAthletesApi } from "./index";

describe("coachingCoachAthletesApi.getAthleteDetail", () => {
  let scenario: TestScenario;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planB: Awaited<ReturnType<typeof createTestPlan>>;
  let athleteForB: Awaited<ReturnType<typeof createTestUser>>;
  let enrollmentBId: string;
  let unrelatedUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    scenario = await createTestScenario({
      planOverrides: { status: TrainingPlanStatus.ACTIVE },
      athleteCount: 2,
      withAthleteProfiles: true,
    });

    await cleanupRaw.user.update({
      where: { id: scenario.coach.user.id },
      data: { timezone: "UTC" },
    });

    coachB = await createTestCoach();
    planB = await createTestPlan(coachB.user.id, { status: TrainingPlanStatus.ACTIVE });

    athleteForB = await createTestUser();
    const enrollmentB = await cleanupRaw.planEnrollment.create({
      data: {
        planId: planB.id,
        userId: athleteForB.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: new Date(),
      },
    });

    enrollmentBId = enrollmentB.id;

    unrelatedUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      ...scenario.toCleanup,
      { table: "planEnrollment", id: enrollmentBId },
      { table: "trainingPlan", id: planB.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachB.user.id },
      { table: "user", id: athleteForB.id },
      { table: "user", id: unrelatedUser.id },
    );
  });

  it("returns detail for an athlete belonging to the coach", async () => {
    const firstAthlete = scenario.athletes[0];

    if (!firstAthlete) {
      throw new Error("Expected at least one athlete in scenario");
    }

    const detail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      firstAthlete.user.id,
    );

    expect(detail.userId).toBe(firstAthlete.user.id);
    expect(detail.email).toBe(firstAthlete.user.email);
    expect(detail.planDiscipline.length).toBeGreaterThanOrEqual(1);
    expect(detail.consistency).toBeDefined();
    expect(typeof detail.consistency.adherenceRate4w).toBe("number");
    expect(typeof detail.consistency.currentStreak).toBe("number");
    expect(typeof detail.consistency.missedThisWeek).toBe("number");
    expect(detail.enrolledSince).toBeInstanceOf(Date);
  });

  it("includes plan discipline data for the athlete", async () => {
    const firstAthlete = scenario.athletes[0];

    if (!firstAthlete) {
      throw new Error("Expected at least one athlete in scenario");
    }

    const detail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      firstAthlete.user.id,
    );

    for (const plan of detail.planDiscipline) {
      expect(plan.planId).toBeDefined();
      expect(plan.planName).toBeDefined();
      expect(plan.enrollmentStatus).toBeDefined();
      expect(plan.enrolledDate).toBeInstanceOf(Date);
      expect(plan.completed).toBe(0);
      expect(plan.available).toBe(0);
      expect(plan.planned).toBe(0);
    }
  });

  it("throws ForbiddenError when coach tries to view another coach's athlete", async () => {
    await expect(
      coachingCoachAthletesApi.getAthleteDetail(scenario.coach.user.id, athleteForB.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError for user without coach profile", async () => {
    const firstAthlete = scenario.athletes[0];

    if (!firstAthlete) {
      throw new Error("Expected at least one athlete in scenario");
    }

    await expect(
      coachingCoachAthletesApi.getAthleteDetail(unrelatedUser.id, firstAthlete.user.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError for athlete not assigned to coach", async () => {
    const randomUser = await createTestUser();

    await expect(
      coachingCoachAthletesApi.getAthleteDetail(scenario.coach.user.id, randomUser.id),
    ).rejects.toThrow(ForbiddenError);

    await cleanup({ table: "user", id: randomUser.id });
  });

  it("returns populated recentWorkouts and non-zero adherenceRate4w when sessions exist", async () => {
    const athleteUser = await createTestUser();
    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: scenario.coach.profile.id, athleteId: athleteUser.id },
    });
    const plan = await createTestPlan(scenario.coach.user.id);
    const enrollment = await createTestEnrollment(plan.id, athleteUser.id);

    const sessionIds: string[] = [];

    for (let i = 0; i < 3; i++) {
      const s = await createTestWorkoutSession({
        userId: athleteUser.id,
        enrollmentId: enrollment.id,
        overrides: {
          startedAt: new Date(Date.now() - i * 86_400_000),
          completedAt: new Date(Date.now() - i * 86_400_000),
          completionRatio: 1.0,
        },
      });

      sessionIds.push(s.id);
    }

    try {
      const detail = await coachingCoachAthletesApi.getAthleteDetail(
        scenario.coach.user.id,
        athleteUser.id,
      );

      expect(detail.recentWorkouts.length).toBeGreaterThan(0);
      expect(detail.consistency.adherenceRate4w).toBeGreaterThan(0);
    } finally {
      for (const id of sessionIds) {
        await cleanup({ table: "workoutSession", id });
      }
      await cleanup(
        { table: "planEnrollment", id: enrollment.id },
        { table: "trainingPlan", id: plan.id },
        { table: "coachAthleteAssignment", id: assignment.id },
        { table: "user", id: athleteUser.id },
      );
    }
  });

  it("returns healthStatus and processStatus fields", async () => {
    const firstAthlete = scenario.athletes[0];

    if (!firstAthlete) {
      throw new Error("Expected at least one athlete in scenario");
    }

    const detail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      firstAthlete.user.id,
    );

    expect(detail.healthStatus).toBeDefined();
    expect(detail.processStatus).toBeDefined();
  });

  it("returns detail for an assigned athlete with zero active enrollments", async () => {
    const assignedOnlyUser = await createTestUser();
    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: scenario.coach.profile.id, athleteId: assignedOnlyUser.id },
    });

    try {
      const detail = await coachingCoachAthletesApi.getAthleteDetail(
        scenario.coach.user.id,
        assignedOnlyUser.id,
      );

      expect(detail.userId).toBe(assignedOnlyUser.id);
      expect(detail.planDiscipline).toEqual([]);
      expect(detail.processStatus).toBe(ProcessStatus.STEADY);
      expect(detail.recentWorkouts).toEqual([]);
      expect(detail.nextWorkout).toBeNull();
      expect(detail.consistency.adherenceRate4w).toBe(0);
      expect(detail.consistency.currentStreak).toBe(0);
      expect(detail.consistency.missedThisWeek).toBe(0);
      expect(detail.enrolledSince.getTime()).toBe(assignment.createdAt.getTime());
      expect(detail.lastActivityDate).toBeNull();
      expect(detail.daysSinceLastActivity).toBeNull();
    } finally {
      await cleanup(
        { table: "coachAthleteAssignment", id: assignment.id },
        { table: "user", id: assignedOnlyUser.id },
      );
    }
  });
});
