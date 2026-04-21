import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestScenario,
  createTestUser,
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
      workoutCount: 3,
      athleteCount: 2,
      withAthleteProfiles: true,
      withWorkoutLogs: true,
    });

    await cleanupRaw.user.update({
      where: { id: scenario.coach.user.id },
      data: { timezone: "UTC" },
    });

    coachB = await createTestCoach();
    planB = await createTestPlan(coachB.profile.id, { status: TrainingPlanStatus.ACTIVE });

    athleteForB = await createTestUser();
    const enrollmentB = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: planB.id,
        userId: athleteForB.id,
        status: PlanEnrollmentStatus.ACTIVE,
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
      expect(typeof plan.completed).toBe("number");
      expect(typeof plan.available).toBe("number");
      expect(typeof plan.planned).toBe("number");
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
});
