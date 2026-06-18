import { EnrollmentStatus } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../db/client";
import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestEnrollment,
  createTestPerformedSession,
  createTestScheduleScenario,
} from "../../../test/schedule-helpers";

import { lmsPlanTimetableApi } from "./plan-timetable";

const TZ = "UTC";
const WEEKS_BACK = 2;
const SESSIONS_PER_WEEK = 3;
const DAYS_IN_FULL_WEEK = 7;

describe("lmsPlanTimetableApi.getTimetable", () => {
  describe("with an active multi-week schedule", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: SESSIONS_PER_WEEK,
        completions: [{ weekIndex: 0, dayIndex: 0 }],
      });
    });

    afterAll(async () => {
      await cleanup(...scenario.toCleanup);
    });

    it("returns the athlete's active plan with seven-slot weeks", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenario.athlete.id);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0]?.planId).toBe(scenario.plan.id);
      expect(result.plans[0]?.weeks).toHaveLength(WEEKS_BACK + 1);

      for (const week of result.plans[0]?.weeks ?? []) {
        expect(week.days).toHaveLength(DAYS_IN_FULL_WEEK);
      }
    });

    it("marks done true exactly for the completed session", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenario.athlete.id);

      const completed = scenario.sessions.find(
        (session) => session.weekIndex === 0 && session.dayIndex === 0,
      );
      const completedId = completed?.sessionId;

      const doneIds = new Set(
        (result.plans[0]?.weeks ?? []).flatMap((week) =>
          week.days.flatMap((slot) =>
            slot.sessions.filter((card) => card.done).map((card) => card.sessionId),
          ),
        ),
      );

      expect(completedId).toBeDefined();
      expect(doneIds.has(completedId ?? "")).toBe(true);
      expect(doneIds.size).toBe(1);
    });

    it("points todayWeekIndex and landingWeekIndex at the week covering today", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenario.athlete.id);
      const plan = result.plans[0];

      expect(plan?.todayWeekIndex).not.toBeNull();

      const todayWeek = plan?.weeks.find((week) => week.index === plan.todayWeekIndex);

      expect(todayWeek?.days.some((slot) => slot.isToday)).toBe(true);
      expect(plan?.landingWeekIndex).toBe(plan?.todayWeekIndex);
    });
  });

  describe("query-count invariant (no N+1)", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: SESSIONS_PER_WEEK,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(async () => {
      await cleanup(...scenario.toCleanup);
    });

    it("issues exactly one enrollment findMany and one performed-session findMany", async () => {
      const enrollmentSpy = vi.spyOn(prisma.planEnrollment, "findMany");
      const performedSpy = vi.spyOn(prisma.performedSession, "findMany");
      const userSpy = vi.spyOn(prisma.user, "findUnique");

      await lmsPlanTimetableApi.getTimetable(scenario.athlete.id);

      expect(enrollmentSpy).toHaveBeenCalledTimes(1);
      expect(performedSpy).toHaveBeenCalledTimes(1);
      expect(userSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("athlete isolation", () => {
    let scenarioA: Awaited<ReturnType<typeof createTestScheduleScenario>>;
    let scenarioB: Awaited<ReturnType<typeof createTestScheduleScenario>>;
    const crossCleanup: CleanupEntry[] = [];

    beforeAll(async () => {
      scenarioA = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: 0,
        sessionsPerWeek: 1,
      });
      scenarioB = await createTestScheduleScenario({
        coach: scenarioA.coach,
        tz: TZ,
        weeksBack: 0,
        sessionsPerWeek: 1,
      });

      const sharedSession = scenarioA.sessions[0];

      if (sharedSession) {
        const crossPerformed = await createTestPerformedSession(
          sharedSession.sessionId,
          scenarioB.athlete.id,
        );

        crossCleanup.push(...crossPerformed.toCleanup);
      }
    });

    afterAll(async () => {
      await cleanup(...crossCleanup);
      await cleanup(...scenarioB.toCleanup);
      await cleanup(...scenarioA.toCleanup);
    });

    it("returns only the requesting athlete's plan", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenarioA.athlete.id);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0]?.planId).toBe(scenarioA.plan.id);
      expect(result.plans.some((plan) => plan.planId === scenarioB.plan.id)).toBe(false);
    });

    it("does not mark athlete A's session done because athlete B performed it", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenarioA.athlete.id);

      const doneIds = (result.plans[0]?.weeks ?? []).flatMap((week) =>
        week.days.flatMap((slot) =>
          slot.sessions.filter((card) => card.done).map((card) => card.sessionId),
        ),
      );

      expect(doneIds).toHaveLength(0);
    });
  });

  describe("date-thread", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: SESSIONS_PER_WEEK,
      });

      const thisWeek = scenario.sessions.find((session) => session.weekIndex === 0);

      if (!thisWeek) {
        throw new Error("schedule scenario produced no current-week session");
      }

      await cleanupRaw.planEnrollment.update({
        where: { id: scenario.enrollment.id },
        data: { hidePastBeforeBoarding: true, boardedAt: thisWeek.sessionDate },
      });
    });

    afterAll(async () => {
      await cleanup(...scenario.toCleanup);
    });

    it("hides weeks fully before the boarding date and re-indexes survivors", async () => {
      const result = await lmsPlanTimetableApi.getTimetable(scenario.athlete.id);
      const weeks = result.plans[0]?.weeks ?? [];

      expect(weeks.length).toBeLessThan(WEEKS_BACK + 1);
      expect(weeks[0]?.index).toBe(0);
      expect(weeks.every((week) => week.days.length > 0)).toBe(true);
    });
  });

  describe("empty and inactive enrollments", () => {
    it("returns an empty plan list for an athlete with no enrollment", async () => {
      const athlete = await createTestUser();

      try {
        const result = await lmsPlanTimetableApi.getTimetable(athlete.id);

        expect(result).toEqual({ plans: [] });
      } finally {
        await cleanup({ table: "user", id: athlete.id });
      }
    });

    it("excludes a PAUSED enrollment from the plan list", async () => {
      const coach = await createTestCoach();
      const athlete = await createTestUser();
      const plan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const enrollment = await createTestEnrollment(plan.id, athlete.id, coach.user.id, {
        status: EnrollmentStatus.PAUSED,
      });

      try {
        const result = await lmsPlanTimetableApi.getTimetable(athlete.id);

        expect(result).toEqual({ plans: [] });
      } finally {
        await cleanup(
          ...enrollment.toCleanup,
          { table: "trainingPlan", id: plan.id },
          { table: "user", id: athlete.id },
          { table: "coachProfile", id: coach.profile.id },
          { table: "user", id: coach.user.id },
        );
      }
    });
  });
});
