import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestScenario,
  createTestUser,
  type TestScenario,
} from "../../test/helpers";

import { coachingPlanRosterApi } from "./plan-roster";

describe("coachingPlanRosterApi", () => {
  let scenario: TestScenario;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planB: Awaited<ReturnType<typeof createTestPlan>>;
  let unrelatedUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    scenario = await createTestScenario({
      planOverrides: { status: TrainingPlanStatus.ACTIVE },
      athleteCount: 3,
      withAthleteProfiles: true,
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

  describe("list", () => {
    it("returns all enrollments for a plan owned by the coach", async () => {
      const entries = await coachingPlanRosterApi.list(scenario.coach.user.id, scenario.plan.id);

      expect(entries).toHaveLength(scenario.athletes.length);

      for (const entry of entries) {
        expect(entry.id).toBeDefined();
        expect(entry.planId).toBe(scenario.plan.id);
        expect(entry.user).toBeDefined();
        expect(entry.user.id).toBeDefined();
        expect(entry.user.email).toBeDefined();
        expect(entry.createdAt).toBeInstanceOf(Date);
      }
    });

    it("returns empty list for plan with no enrollments", async () => {
      const emptyPlan = await createTestPlan(scenario.coach.user.id, {
        status: TrainingPlanStatus.ACTIVE,
      });

      const entries = await coachingPlanRosterApi.list(scenario.coach.user.id, emptyPlan.id);

      expect(entries).toHaveLength(0);

      await cleanup({ table: "trainingPlan", id: emptyPlan.id });
    });

    it("throws ForbiddenError when coach tries to list roster for another coach's plan", async () => {
      await expect(coachingPlanRosterApi.list(scenario.coach.user.id, planB.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for non-existent plan", async () => {
      await expect(
        coachingPlanRosterApi.list(scenario.coach.user.id, "cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getById", () => {
    it("returns a specific enrollment by id", async () => {
      const firstAthlete = scenario.athletes[0];

      if (!firstAthlete) {
        throw new Error("Expected at least one athlete in scenario");
      }

      const entry = await coachingPlanRosterApi.getById(
        scenario.coach.user.id,
        scenario.plan.id,
        firstAthlete.enrollment.id,
      );

      expect(entry.id).toBe(firstAthlete.enrollment.id);
      expect(entry.planId).toBe(scenario.plan.id);
      expect(entry.userId).toBe(firstAthlete.user.id);
      expect(entry.user.id).toBe(firstAthlete.user.id);
      expect(entry.user.email).toBe(firstAthlete.user.email);
      expect(entry.startedOnDate).toBeInstanceOf(Date);
    });

    it("throws ForbiddenError when coach tries to access roster entry of another coach's plan", async () => {
      const athleteForB = await createTestUser();

      const enrollmentB = await cleanupRaw.planEnrollment.create({
        data: {
          planId: planB.id,
          userId: athleteForB.id,
          status: PlanEnrollmentStatus.ACTIVE,
          startedAtWeekIndex: 0,
          startedOnDate: new Date(),
        },
      });

      await expect(
        coachingPlanRosterApi.getById(scenario.coach.user.id, planB.id, enrollmentB.id),
      ).rejects.toThrow(ForbiddenError);

      await cleanup(
        { table: "planEnrollment", id: enrollmentB.id },
        { table: "user", id: athleteForB.id },
      );
    });

    it("throws NotFoundError for non-existent enrollment id", async () => {
      await expect(
        coachingPlanRosterApi.getById(
          scenario.coach.user.id,
          scenario.plan.id,
          "cl000000000000000000000000",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when enrollment belongs to a different plan", async () => {
      const otherPlan = await createTestPlan(scenario.coach.user.id, {
        status: TrainingPlanStatus.ACTIVE,
      });
      const otherUser = await createTestUser();

      const otherEnrollment = await cleanupRaw.planEnrollment.create({
        data: {
          planId: otherPlan.id,
          userId: otherUser.id,
          status: PlanEnrollmentStatus.ACTIVE,
          startedAtWeekIndex: 0,
          startedOnDate: new Date(),
        },
      });

      await expect(
        coachingPlanRosterApi.getById(scenario.coach.user.id, scenario.plan.id, otherEnrollment.id),
      ).rejects.toThrow(NotFoundError);

      await cleanup(
        { table: "planEnrollment", id: otherEnrollment.id },
        { table: "trainingPlan", id: otherPlan.id },
        { table: "user", id: otherUser.id },
      );
    });
  });
});
