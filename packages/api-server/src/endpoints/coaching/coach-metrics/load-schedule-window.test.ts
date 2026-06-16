import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, createTestCoach, createTestPlan, createTestUser } from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestEnrollment,
  createTestScheduleScenario,
  createTestWeek,
} from "../../../test/schedule-helpers";

import { buildPerformedKey } from "./coach-metrics.types";
import { loadScheduleWindow } from "./load-schedule-window";

const TZ = "UTC";
const WEEKS_BACK = 2;
const SESSIONS_PER_WEEK = 3;

describe("loadScheduleWindow", () => {
  describe("with a seeded multi-week schedule", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: SESSIONS_PER_WEEK,
        completions: [
          { weekIndex: 1, dayIndex: 0 },
          { weekIndex: 0, dayIndex: 0 },
        ],
      });
    });

    afterAll(async () => {
      await cleanup(...scenario.toCleanup);
    });

    it("groups enrollments under the requesting athlete id", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [scenario.athlete.id],
        tz: TZ,
        now: new Date(),
      });

      const enrollments = window.enrollmentsByAthlete.get(scenario.athlete.id);

      expect(enrollments).toHaveLength(1);
      expect(enrollments?.[0]?.planId).toBe(scenario.plan.id);
    });

    it("includes every in-window week in the enrollment payload", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [scenario.athlete.id],
        tz: TZ,
        now: new Date(),
      });

      const enrollment = window.enrollmentsByAthlete.get(scenario.athlete.id)?.[0];

      expect(enrollment?.plan.weeks).toHaveLength(WEEKS_BACK + 1);
    });

    it("keys performed sessions by userId:sessionId", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [scenario.athlete.id],
        tz: TZ,
        now: new Date(),
      });

      for (const performed of scenario.performed) {
        const key = buildPerformedKey(scenario.athlete.id, performed.sessionId);
        const entry = window.performedByKey.get(key);

        expect(entry).toBeDefined();
        expect(entry?.completedAt).toBeInstanceOf(Date);
      }
    });

    it("counts all weeks of the plan via weekCountByPlan", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [scenario.athlete.id],
        tz: TZ,
        now: new Date(),
      });

      expect(window.weekCountByPlan.get(scenario.plan.id)).toBe(WEEKS_BACK + 1);
    });

    it("records the earliest week start per plan via firstWeekStartByPlan", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [scenario.athlete.id],
        tz: TZ,
        now: new Date(),
      });

      const earliest = scenario.sessions.reduce<Date | null>((min, session) => {
        if (!min || session.sessionDate < min) {
          return session.sessionDate;
        }

        return min;
      }, null);

      const firstWeekStart = window.firstWeekStartByPlan.get(scenario.plan.id);

      expect(firstWeekStart).toBeInstanceOf(Date);
      expect(firstWeekStart?.getTime()).toBe(earliest?.getTime());
    });
  });

  describe("isolation and window boundaries", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;
    let athleteInScope: Awaited<ReturnType<typeof createTestUser>>;
    let athleteOutOfScope: Awaited<ReturnType<typeof createTestUser>>;
    let plan: Awaited<ReturnType<typeof createTestPlan>>;
    let toCleanup: CleanupEntry[] = [];

    beforeAll(async () => {
      coach = await createTestCoach();
      athleteInScope = await createTestUser();
      athleteOutOfScope = await createTestUser();
      plan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

      const inScopeEnrollment = await createTestEnrollment(
        plan.id,
        athleteInScope.id,
        coach.user.id,
      );
      const outOfScopeEnrollment = await createTestEnrollment(
        plan.id,
        athleteOutOfScope.id,
        coach.user.id,
      );

      const staleWeek = await createTestWeek(plan.id, {
        startDate: new Date("2000-01-03T00:00:00.000Z"),
      });

      toCleanup = [
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
        { table: "user", id: athleteInScope.id },
        { table: "user", id: athleteOutOfScope.id },
        { table: "trainingPlan", id: plan.id },
        ...inScopeEnrollment.toCleanup,
        ...outOfScopeEnrollment.toCleanup,
        ...staleWeek.toCleanup,
      ];
    });

    afterAll(async () => {
      await cleanup(...toCleanup);
    });

    it("returns empty maps without querying when athleteIds is empty", async () => {
      const window = await loadScheduleWindow({ athleteIds: [], tz: TZ, now: new Date() });

      expect(window.enrollmentsByAthlete.size).toBe(0);
      expect(window.performedByKey.size).toBe(0);
      expect(window.weekCountByPlan.size).toBe(0);
      expect(window.firstWeekStartByPlan.size).toBe(0);
    });

    it("excludes athletes not in the requested id set", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [athleteInScope.id],
        tz: TZ,
        now: new Date(),
      });

      expect(window.enrollmentsByAthlete.has(athleteInScope.id)).toBe(true);
      expect(window.enrollmentsByAthlete.has(athleteOutOfScope.id)).toBe(false);
    });

    it("filters out weeks whose startDate falls outside the adherence window", async () => {
      const window = await loadScheduleWindow({
        athleteIds: [athleteInScope.id],
        tz: TZ,
        now: new Date(),
      });

      const enrollment = window.enrollmentsByAthlete.get(athleteInScope.id)?.[0];

      expect(enrollment?.plan.weeks).toHaveLength(0);
    });
  });
});
