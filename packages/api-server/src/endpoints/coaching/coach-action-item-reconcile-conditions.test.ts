import { afterEach, describe, expect, it } from "vitest";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coaching/coach-action-item";

import { cleanup, cleanupRaw } from "../../test/helpers";
import {
  type CleanupEntry,
  createTestPerformedSession,
  createTestScheduleScenario,
  type ScheduledSessionRef,
} from "../../test/schedule-helpers";
import { addDaysInTz, startOfDayInTz } from "../../utils/date-helpers";

import {
  type AssignedAthleteWithData,
  buildAssignedAthleteInclude,
} from "./assigned-athlete-query";
import { computeMissedWorkoutsConditions } from "./coach-action-item-reconcile";

const TZ = "UTC";
const FULL_WEEK = 7;
const WEEKS_BACK = 1;
const WARNING_CAP_DAYS_BACK = 4;

let activeCleanup: CleanupEntry[] = [];

const loadAssignments = async (coachUserId: string): Promise<AssignedAthleteWithData[]> =>
  cleanupRaw.coachAthleteAssignment.findMany({
    where: { coach: { userId: coachUserId } },
    include: buildAssignedAthleteInclude(coachUserId),
  });

const findSessionByOffset = (
  sessions: ScheduledSessionRef[],
  daysBack: number,
): ScheduledSessionRef | undefined => {
  const target = addDaysInTz(startOfDayInTz(new Date(), TZ), -daysBack, TZ).getTime();

  return sessions.find((session) => session.sessionDate.getTime() === target);
};

afterEach(async () => {
  await cleanup(...activeCleanup);
  activeCleanup = [];
});

describe("computeMissedWorkoutsConditions", () => {
  it("emits a CRITICAL condition when a fully-seeded schedule has no completions", async () => {
    const scenario = await createTestScheduleScenario({
      tz: TZ,
      weeksBack: WEEKS_BACK,
      sessionsPerWeek: FULL_WEEK,
      completions: [],
    });

    activeCleanup = scenario.toCleanup;

    const assignments = await loadAssignments(scenario.coach.user.id);
    const conditions = await computeMissedWorkoutsConditions(assignments, TZ);

    const missed = conditions.find(
      (condition) =>
        condition.type === ActionItemType.MISSED_WORKOUTS &&
        condition.athleteId === scenario.athlete.id,
    );

    expect(missed?.severity).toBe(ActionItemSeverity.CRITICAL);
    expect(missed?.metadata).toEqual({ lastActivityDate: "" });
  });

  it("emits a WARNING condition when the missed streak is capped below the critical threshold", async () => {
    const scenario = await createTestScheduleScenario({
      tz: TZ,
      weeksBack: WEEKS_BACK,
      sessionsPerWeek: FULL_WEEK,
      completions: [],
    });

    activeCleanup = scenario.toCleanup;

    const capSession = findSessionByOffset(scenario.sessions, WARNING_CAP_DAYS_BACK);

    expect(capSession).toBeDefined();

    if (capSession) {
      const performed = await createTestPerformedSession(
        capSession.sessionId,
        scenario.athlete.id,
        {
          startedAt: capSession.sessionDate,
          completedAt: capSession.sessionDate,
        },
      );

      activeCleanup = [...scenario.toCleanup, ...performed.toCleanup];
    }

    const assignments = await loadAssignments(scenario.coach.user.id);
    const conditions = await computeMissedWorkoutsConditions(assignments, TZ);

    const missed = conditions.find(
      (condition) =>
        condition.type === ActionItemType.MISSED_WORKOUTS &&
        condition.athleteId === scenario.athlete.id,
    );

    expect(missed?.severity).toBe(ActionItemSeverity.WARNING);
  });

  it("emits no condition when the most recent scheduled days are completed", async () => {
    const scenario = await createTestScheduleScenario({
      tz: TZ,
      weeksBack: WEEKS_BACK,
      sessionsPerWeek: FULL_WEEK,
      completions: [],
    });

    activeCleanup = scenario.toCleanup;

    const recent = [1, 2, 3]
      .map((daysBack) => findSessionByOffset(scenario.sessions, daysBack))
      .filter((session): session is ScheduledSessionRef => session !== undefined);

    for (const session of recent) {
      const performed = await createTestPerformedSession(session.sessionId, scenario.athlete.id, {
        startedAt: session.sessionDate,
        completedAt: session.sessionDate,
      });

      activeCleanup.push(...performed.toCleanup);
    }

    const assignments = await loadAssignments(scenario.coach.user.id);
    const conditions = await computeMissedWorkoutsConditions(assignments, TZ);

    const missed = conditions.find(
      (condition) =>
        condition.type === ActionItemType.MISSED_WORKOUTS &&
        condition.athleteId === scenario.athlete.id,
    );

    expect(missed).toBeUndefined();
  });
});
