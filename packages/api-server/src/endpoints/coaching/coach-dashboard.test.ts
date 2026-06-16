import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { coachDashboardDataSchema, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { inMemoryCache } from "../../infrastructure/cache";
import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";
import { type CompletionRef, createTestScheduleScenario } from "../../test/schedule-helpers";
import { startOfDayInTz } from "../../utils/date-helpers";

import { buildCoachMetricsCacheKey } from "./coach-action-item";
import { coachingCoachDashboardApi } from "./coach-dashboard";

const TZ = "UTC";
const FULL_WEEK = 7;
const WEEKS_BACK = 1;

const todaysCompletion = (
  sessions: { weekIndex: number; dayIndex: number; sessionDate: Date }[],
): CompletionRef | null => {
  const startOfToday = startOfDayInTz(new Date(), TZ).getTime();
  const today = sessions.find(
    (session) => session.weekIndex === 0 && session.sessionDate.getTime() === startOfToday,
  );

  return today ? { weekIndex: today.weekIndex, dayIndex: today.dayIndex } : null;
};

describe("coachingCoachDashboardApi.getDashboard", () => {
  describe("with a seeded roster", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: FULL_WEEK,
        completions: [],
      });

      const completion = todaysCompletion(scenario.sessions);

      if (completion) {
        const target = scenario.sessions.find(
          (session) =>
            session.weekIndex === completion.weekIndex && session.dayIndex === completion.dayIndex,
        );

        if (target) {
          const performed = await cleanupRaw.performedSession.create({
            data: {
              sessionId: target.sessionId,
              userId: scenario.athlete.id,
              startedAt: target.sessionDate,
              completedAt: target.sessionDate,
            },
          });

          scenario.toCleanup.push({ table: "performedSession", id: performed.id });
        }
      }

      await inMemoryCache.delete(buildCoachMetricsCacheKey(scenario.coach.profile.id));
    });

    afterAll(async () => {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { coachId: scenario.coach.profile.id } })
        .catch(() => {});
      await inMemoryCache.delete(buildCoachMetricsCacheKey(scenario.coach.profile.id));
      await cleanup(...scenario.toCleanup);
    });

    it("returns a payload that satisfies the dashboard contract", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(scenario.coach.user.id);

      expect(coachDashboardDataSchema.safeParse(data).success).toBe(true);
    });

    it("counts the seeded athlete in the active roster", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(scenario.coach.user.id);

      expect(data.overview.totalActiveAthletes).toBe(1);
    });

    it("surfaces a real per-athlete schedule summary for the seeded plan", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(scenario.coach.user.id);
      const summary = data.athletesSummary.find((item) => item.userId === scenario.athlete.id);

      expect(summary?.planId).toBe(scenario.plan.id);
      expect(summary?.todayStatus).toBe(TodayStatus.COMPLETED);
    });

    it("reports a completed workout today in the overview counts", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(scenario.coach.user.id);

      expect(data.overview.workoutsCompletedToday).toBeGreaterThanOrEqual(1);
      expect(data.overview.workoutsPlannedToday).toBeGreaterThanOrEqual(1);
    });

    it("places the seeded athlete in exactly one progress bucket", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(scenario.coach.user.id);
      const allBucketed = [
        ...data.progressBuckets.onTrack,
        ...data.progressBuckets.steady,
        ...data.progressBuckets.fallingBehind,
      ];

      expect(allBucketed.filter((item) => item.userId === scenario.athlete.id)).toHaveLength(1);
    });
  });

  describe("coach isolation", () => {
    let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;
    let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      scenario = await createTestScheduleScenario({
        tz: TZ,
        weeksBack: WEEKS_BACK,
        sessionsPerWeek: FULL_WEEK,
        completions: [],
      });

      otherCoach = await createTestCoach();

      await cleanupRaw.user.update({ where: { id: otherCoach.user.id }, data: { timezone: TZ } });
    });

    afterAll(async () => {
      await cleanupRaw.coachActionItem
        .deleteMany({
          where: { coachId: { in: [scenario.coach.profile.id, otherCoach.profile.id] } },
        })
        .catch(() => {});
      await inMemoryCache.delete(buildCoachMetricsCacheKey(scenario.coach.profile.id));
      await inMemoryCache.delete(buildCoachMetricsCacheKey(otherCoach.profile.id));
      await cleanup(
        { table: "coachProfile", id: otherCoach.profile.id },
        { table: "user", id: otherCoach.user.id },
      );
      await cleanup(...scenario.toCleanup);
    });

    it("does not expose another coach's athletes", async () => {
      const data = await coachingCoachDashboardApi.getDashboard(otherCoach.user.id);

      expect(data.overview.totalActiveAthletes).toBe(0);
      expect(data.athletesSummary).toHaveLength(0);
    });
  });
});
