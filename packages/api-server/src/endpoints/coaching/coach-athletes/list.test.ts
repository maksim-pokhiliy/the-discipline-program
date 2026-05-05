import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
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
import { createCoachWithAthleteSessions } from "../dashboard-computations.test-helpers";

import { coachingCoachAthletesApi } from "./index";

describe("coachingCoachAthletesApi.getAthletes", () => {
  let scenario: TestScenario;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planB: Awaited<ReturnType<typeof createTestPlan>>;
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
      expect(athlete.activePlans).toEqual([]);
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

  it("scopes athletes to assignments only — does not see another coach's athletes", async () => {
    const athleteForB = await createTestUser();

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
      { table: "user", id: athleteForB.id },
    );
  });

  it("includes assigned athletes (active plans always empty post-rollback)", async () => {
    const assignedOnlyUser = await createTestUser();
    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: scenario.coach.profile.id, athleteId: assignedOnlyUser.id },
    });

    try {
      const result = await coachingCoachAthletesApi.getAthletes(scenario.coach.user.id);

      const entry = result.athletes.find((a) => a.userId === assignedOnlyUser.id);

      expect(entry).toBeDefined();
      expect(entry?.activePlans).toEqual([]);
      expect(entry?.processStatus).toBe(ProcessStatus.FALLING_BEHIND);
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

  it("does not include unassigned athletes", async () => {
    const unassignedScenario = await createTestScenario({
      planOverrides: { status: TrainingPlanStatus.ACTIVE },
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

  it("returns real processStatus and lastActivityDate from session data", async () => {
    const { coachId, athlete, toCleanup } = await createCoachWithAthleteSessions({
      sessionsCount: 5,
      completionRatios: [1, 1, 1, 1, 1],
    });

    try {
      const result = await coachingCoachAthletesApi.getAthletes(coachId);

      const entry = result.athletes.find((a) => a.userId === athlete.athleteId);

      expect(entry).toBeDefined();
      expect(entry?.processStatus).toBe(ProcessStatus.ON_TRACK);
      expect(entry?.lastActivityDate).toBeInstanceOf(Date);
    } finally {
      await cleanup(...toCleanup);
    }
  });
});
