import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  coachAthleteDetailSchema,
  type CoachAthleteDetail,
} from "@repo/contracts/coaching/coach-athletes";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { ForbiddenError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestCoach } from "../../../test/helpers";
import { createTestScheduleScenario } from "../../../test/schedule-helpers";
import { addDaysInTz, startOfDayInTz } from "../../../utils/date-helpers";

import { coachingCoachAthletesApi } from "./index";

const TZ = "UTC";
const FULL_WEEK = 7;
const WEEKS_BACK = 1;
const LAST_7_DAYS = 7;
const RECENT_COMPLETED_OFFSETS = [0, 1, 2, 3];

describe("coachingCoachAthletesApi.getAthleteDetail", () => {
  let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    scenario = await createTestScheduleScenario({
      tz: TZ,
      weeksBack: WEEKS_BACK,
      sessionsPerWeek: FULL_WEEK,
      completions: [],
    });

    const startOfToday = startOfDayInTz(new Date(), TZ);

    for (const daysBack of RECENT_COMPLETED_OFFSETS) {
      const targetTime = addDaysInTz(startOfToday, -daysBack, TZ).getTime();
      const target = scenario.sessions.find(
        (session) => session.sessionDate.getTime() === targetTime,
      );

      if (!target) {
        continue;
      }

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

    otherCoach = await createTestCoach();
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: otherCoach.user.id },
    );
    await cleanup(...scenario.toCleanup);
  });

  it("returns a payload that satisfies the detail contract", async () => {
    const detail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      scenario.athlete.id,
    );

    expect(coachAthleteDetailSchema.safeParse(detail).success).toBe(true);
  });

  it("fills the additive week-of-cycle and today fields from the schedule", async () => {
    const detail: CoachAthleteDetail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      scenario.athlete.id,
    );

    expect(detail.last7Days).toHaveLength(LAST_7_DAYS);
    expect(detail.totalWeeks).toBe(WEEKS_BACK + 1);
    expect(detail.currentWeek).toBe(WEEKS_BACK + 1);
    expect(detail.todayStatus).toBe(TodayStatus.COMPLETED);
    expect(detail.todayWorkoutTitle).toBe("Workout");
  });

  it("derives real plan discipline and consistency for the seeded plan", async () => {
    const detail = await coachingCoachAthletesApi.getAthleteDetail(
      scenario.coach.user.id,
      scenario.athlete.id,
    );

    expect(detail.planDiscipline).toHaveLength(1);
    expect(detail.planDiscipline[0]?.planId).toBe(scenario.plan.id);
    expect(detail.consistency.currentStreak).toBeGreaterThanOrEqual(1);
    expect(detail.lastActivityDate).toBeInstanceOf(Date);
  });

  it("throws ForbiddenError when the athlete is not assigned to the coach", async () => {
    await expect(
      coachingCoachAthletesApi.getAthleteDetail(otherCoach.user.id, scenario.athlete.id),
    ).rejects.toThrow(ForbiddenError);
  });
});
