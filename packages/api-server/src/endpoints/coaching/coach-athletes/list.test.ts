import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
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

describe("coachingCoachAthletesApi.getAthletes", () => {
  let scenario: TestScenario;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planB: Awaited<ReturnType<typeof createTestPlan>>;
  let unrelatedUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    scenario = await createTestScenario({
      planOverrides: { status: TrainingPlanStatus.ACTIVE },
      workoutCount: 2,
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
    unrelatedUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      ...scenario.toCleanup,
      { table: "trainingPlan", id: planB.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachB.user.id },
      { table: "user", id: unrelatedUser.id },
    );
  });

  it("returns athletes assigned to the coach", async () => {
    const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

    expect(result.athletes.length).toBe(scenario.athletes.length);
    expect(result.summary.total).toBe(scenario.athletes.length);
    expect(result.summary.active).toBe(scenario.athletes.length);
  });

  it("returns correct athlete data fields", async () => {
    const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

    for (const athlete of result.athletes) {
      expect(athlete.userId).toBeDefined();
      expect(athlete.email).toBeDefined();
      expect(athlete.activePlans.length).toBeGreaterThanOrEqual(1);
      expect(athlete.processStatus).toBeDefined();
      expect(athlete.enrolledSince).toBeInstanceOf(Date);
      expect(typeof athlete.openActionItemsCount).toBe("number");
      expect(typeof athlete.needsAttention).toBe("boolean");
    }
  });

  it("returns empty list for coach with no athletes", async () => {
    await cleanupRaw.user.update({
      where: { id: coachB.user.id },
      data: { timezone: "UTC" },
    });

    const result = await coachingCoachAthletesApi.getAthletes(coachB.user.id);

    expect(result.athletes).toHaveLength(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.active).toBe(0);
    expect(result.summary.needsAttention).toBe(0);
    expect(result.summary.injured).toBe(0);
    expect(result.summary.restricted).toBe(0);
  });

  it("throws ForbiddenError for user without coach profile", async () => {
    await expect(coachingCoachAthletesApi.getAthletes(unrelatedUser.id)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("does not include athletes from another coach's plans", async () => {
    const athleteForB = await createTestUser();

    const enrollment = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: planB.id,
        userId: athleteForB.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    const assignmentForB = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coachB.profile.id, athleteId: athleteForB.id },
    });

    await cleanupRaw.user.update({
      where: { id: coachB.user.id },
      data: { timezone: "UTC" },
    });

    const resultA = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);
    const resultB = await coachingCoachAthletesApi.getAthletes(coachB.user.id);

    expect(resultA.athletes.some((a) => a.userId === athleteForB.id)).toBe(false);
    expect(resultB.athletes.some((a) => a.userId === athleteForB.id)).toBe(true);

    await cleanup(
      { table: "coachAthleteAssignment", id: assignmentForB.id },
      { table: "planEnrollment", id: enrollment.id },
      { table: "user", id: athleteForB.id },
    );
  });

  it("aggregates plans when athlete is enrolled in multiple plans of the same coach", async () => {
    const secondPlan = await createTestPlan(scenario.coach.profile.id, {
      status: TrainingPlanStatus.ACTIVE,
    });

    const firstAthlete = scenario.athletes[0];

    if (!firstAthlete) {
      throw new Error("Expected at least one athlete in scenario");
    }

    const secondEnrollment = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: secondPlan.id,
        userId: firstAthlete.user.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

    const athleteEntry = result.athletes.find((a) => a.userId === firstAthlete.user.id);

    if (!athleteEntry) {
      throw new Error("Expected athlete to be in results");
    }

    expect(athleteEntry.activePlans.length).toBeGreaterThanOrEqual(2);

    await cleanup(
      { table: "planEnrollment", id: secondEnrollment.id },
      { table: "trainingPlan", id: secondPlan.id },
    );
  });

  it("includes assigned athletes with zero active enrollments", async () => {
    const assignedOnlyUser = await createTestUser();
    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: scenario.coach.profile.id, athleteId: assignedOnlyUser.id },
    });

    try {
      const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

      const entry = result.athletes.find((a) => a.userId === assignedOnlyUser.id);

      expect(entry).toBeDefined();
      expect(entry?.activePlans).toEqual([]);
      expect(entry?.processStatus).toBe(ProcessStatus.STEADY);
      expect(entry?.lastActivityDate).toBeNull();
      expect(entry?.openActionItemsCount).toBe(0);
      expect(entry?.enrolledSince.getTime()).toBe(assignment.createdAt.getTime());
    } finally {
      await cleanup(
        { table: "coachAthleteAssignment", id: assignment.id },
        { table: "user", id: assignedOnlyUser.id },
      );
    }
  });

  it("does not include enrolled-but-not-assigned athletes", async () => {
    const unassignedScenario = await createTestScenario({
      planOverrides: { status: TrainingPlanStatus.ACTIVE },
      workoutCount: 0,
      athleteCount: 1,
      withAssignments: false,
    });

    await cleanupRaw.user.update({
      where: { id: unassignedScenario.coach.user.id },
      data: { timezone: "UTC" },
    });

    try {
      const result = await coachingCoachAthletesApi.getAthletes(unassignedScenario.coach.user.id);

      expect(result.athletes).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.summary.active).toBe(0);
    } finally {
      await cleanup(...unassignedScenario.toCleanup);
    }
  });

  it("does not include athletes enrolled only in DRAFT plans", async () => {
    const draftPlan = await createTestPlan(scenario.coach.profile.id, {
      status: TrainingPlanStatus.DRAFT,
    });
    const draftAthlete = await createTestUser();

    const draftEnrollment = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: draftPlan.id,
        userId: draftAthlete.id,
        status: PlanEnrollmentStatus.ACTIVE,
      },
    });

    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: scenario.coach.profile.id, athleteId: draftAthlete.id },
    });

    try {
      const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

      const entry = result.athletes.find((a) => a.userId === draftAthlete.id);

      expect(entry).toBeDefined();
      expect(entry?.activePlans).toEqual([]);
    } finally {
      await cleanup(
        { table: "coachAthleteAssignment", id: assignment.id },
        { table: "planEnrollment", id: draftEnrollment.id },
        { table: "trainingPlan", id: draftPlan.id },
        { table: "user", id: draftAthlete.id },
      );
    }
  });
});
