import { DayOfWeek } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ProcessStatus, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { createStartOfDayCache } from "../../../utils/date-helpers";

import { LAST_7_DAYS } from "./coach-metrics.constants";
import { type PerformedByKey, type WindowedEnrollment } from "./coach-metrics.types";
import { computeAthleteMetrics } from "./compute-athlete-metrics";
import {
  makeEnrollment,
  performed,
  restLabel,
  workoutLabel,
} from "./compute-athlete-metrics.test-helpers";

const TZ = "UTC";
const ATHLETE = "athlete-1";
const NOW = new Date("2026-06-17T12:00:00.000Z");
const MONDAY = "2026-06-15";

const mkDate = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

const firstWeekStarts = (enrollments: WindowedEnrollment[]): Map<string, Date> => {
  const map = new Map<string, Date>();

  for (const enrollment of enrollments) {
    for (const week of enrollment.plan.weeks) {
      const current = map.get(enrollment.planId);

      if (!current || week.startDate < current) {
        map.set(enrollment.planId, week.startDate);
      }
    }
  }

  return map;
};

const run = (
  enrollments: WindowedEnrollment[],
  performedByKey: PerformedByKey,
  firstWeekStartByPlan: Map<string, Date> = firstWeekStarts(enrollments),
) =>
  computeAthleteMetrics({
    athleteId: ATHLETE,
    enrollments,
    performedByKey,
    weekCountByPlan: new Map([["plan-1", enrollments[0]?.plan.weeks.length ?? 0]]),
    firstWeekStartByPlan,
    tz: TZ,
    now: NOW,
    startOfDayCache: createStartOfDayCache(TZ),
  });

const fullWeekDays = () => [
  { dayOfWeek: DayOfWeek.MONDAY, label: workoutLabel("Mon"), sessions: [{ id: "s-mon" }] },
  { dayOfWeek: DayOfWeek.TUESDAY, label: workoutLabel("Tue"), sessions: [{ id: "s-tue" }] },
  { dayOfWeek: DayOfWeek.WEDNESDAY, label: workoutLabel("Wed"), sessions: [{ id: "s-wed" }] },
  { dayOfWeek: DayOfWeek.THURSDAY, label: workoutLabel("Thu"), sessions: [{ id: "s-thu" }] },
  { dayOfWeek: DayOfWeek.FRIDAY, label: workoutLabel("Fri"), sessions: [{ id: "s-fri" }] },
];

const singleWeekEnrollment = (days: ReturnType<typeof fullWeekDays>) =>
  makeEnrollment({
    athleteId: ATHLETE,
    boardedAt: mkDate(MONDAY),
    weeks: [{ id: "w-1", startDate: mkDate(MONDAY), days }],
  });

describe("computeAthleteMetrics", () => {
  it("reports COMPLETED today when every non-rest session today is completed", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", startedAt: mkDate("2026-06-16"), completedAt: mkDate("2026-06-16") },
      { sessionId: "s-wed", startedAt: NOW, completedAt: NOW },
    ]);

    const result = run([enrollment], completions);

    expect(result.todayStatus).toBe(TodayStatus.COMPLETED);
    expect(result.todayWorkoutTitle).toBe("Wed");
    expect(result.missedCount).toBe(0);
    expect(result.currentStreak).toBe(2);
  });

  it("reports PENDING today when a non-rest session today is not completed", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
    ]);

    const result = run([enrollment], completions);

    expect(result.todayStatus).toBe(TodayStatus.PENDING);
    expect(result.todayWorkoutTitle).toBe("Wed");
  });

  it("never marks today MISSED and counts only past uncompleted sessions as missed", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());

    const result = run([enrollment], new Map());

    expect(result.todayStatus).toBe(TodayStatus.PENDING);
    expect(result.missedCount).toBe(2);
    expect(result.missedThisWeek).toBe(2);
    expect(result.consecutiveMissedDays).toBe(2);
    expect(result.processStatus).toBe(ProcessStatus.FALLING_BEHIND);
  });

  it("treats a rest-labelled day today as REST_DAY", () => {
    const days = [
      { dayOfWeek: DayOfWeek.WEDNESDAY, label: restLabel, sessions: [{ id: "s-rest" }] },
    ];
    const result = run([singleWeekEnrollment(days)], new Map());

    expect(result.todayStatus).toBe(TodayStatus.REST_DAY);
    expect(result.todayWorkoutTitle).toBeNull();
  });

  it("treats a zero-session day today as REST_DAY", () => {
    const days = [{ dayOfWeek: DayOfWeek.WEDNESDAY, label: null, sessions: [] }];
    const result = run([singleWeekEnrollment(days)], new Map());

    expect(result.todayStatus).toBe(TodayStatus.REST_DAY);
  });

  it("reports NO_SCHEDULE when no enrollment covers today", () => {
    const result = run([], new Map());

    expect(result.todayStatus).toBe(TodayStatus.NO_SCHEDULE);
    expect(result.currentWeek).toBeNull();
    expect(result.totalWeeks).toBe(0);
    expect(result.nextWorkout).toBeNull();
  });

  it("guards adherence divide-by-zero to 0 when nothing is planned in the window", () => {
    const days = [{ dayOfWeek: DayOfWeek.WEDNESDAY, label: null, sessions: [] }];
    const result = run([singleWeekEnrollment(days)], new Map());

    expect(result.adherenceRate).toBe(0);
    expect(result.engagementPct).toBe(0);
  });

  it("computes week-of-cycle index and honest totalWeeks", () => {
    const enrollment = makeEnrollment({
      athleteId: ATHLETE,
      boardedAt: mkDate("2026-06-08"),
      weeks: [
        { id: "w-1", startDate: mkDate("2026-06-08"), days: fullWeekDays() },
        { id: "w-2", startDate: mkDate(MONDAY), days: fullWeekDays() },
      ],
    });

    const result = computeAthleteMetrics({
      athleteId: ATHLETE,
      enrollments: [enrollment],
      performedByKey: new Map(),
      weekCountByPlan: new Map([["plan-1", 6]]),
      firstWeekStartByPlan: firstWeekStarts([enrollment]),
      tz: TZ,
      now: NOW,
      startOfDayCache: createStartOfDayCache(TZ),
    });

    expect(result.currentWeek).toBe(2);
    expect(result.totalWeeks).toBe(6);
  });

  it("derives currentWeek from the plan's first week, not the loaded window", () => {
    const enrollment = makeEnrollment({
      athleteId: ATHLETE,
      boardedAt: mkDate("2026-04-06"),
      weeks: [
        { id: "w-9", startDate: mkDate("2026-06-08"), days: fullWeekDays() },
        { id: "w-10", startDate: mkDate(MONDAY), days: fullWeekDays() },
      ],
    });

    const result = computeAthleteMetrics({
      athleteId: ATHLETE,
      enrollments: [enrollment],
      performedByKey: new Map(),
      weekCountByPlan: new Map([["plan-1", 12]]),
      firstWeekStartByPlan: new Map([["plan-1", mkDate("2026-04-06")]]),
      tz: TZ,
      now: NOW,
      startOfDayCache: createStartOfDayCache(TZ),
    });

    expect(result.currentWeek).toBe(11);
    expect(result.totalWeeks).toBe(12);
  });

  it("builds a length-7 last7Days oldest→newest with per-day status", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
    ]);

    const result = run([enrollment], completions);

    expect(result.last7Days).toHaveLength(LAST_7_DAYS);
    expect(result.last7Days[0]?.date.getTime()).toBeLessThan(
      result.last7Days[LAST_7_DAYS - 1]?.date.getTime() ?? 0,
    );

    const byIso = new Map(result.last7Days.map((day) => [day.date.toISOString(), day.status]));

    expect(byIso.get(mkDate("2026-06-15").toISOString())).toBe(TodayStatus.COMPLETED);
    expect(byIso.get(mkDate("2026-06-16").toISOString())).toBe(TodayStatus.MISSED);
    expect(byIso.get(mkDate("2026-06-17").toISOString())).toBe(TodayStatus.PENDING);
    expect(byIso.get(mkDate("2026-06-14").toISOString())).toBe(TodayStatus.NO_SCHEDULE);
  });

  it("exposes planDiscipline with enrolledDate, planned/available/completed for this week", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
    ]);

    const result = run([enrollment], completions);
    const discipline = result.planDiscipline[0];

    expect(result.planDiscipline).toHaveLength(1);
    expect(discipline?.planId).toBe("plan-1");
    expect(discipline?.enrolledDate.getTime()).toBe(mkDate(MONDAY).getTime());
    expect(discipline?.planned).toBe(5);
    expect(discipline?.available).toBe(3);
    expect(discipline?.completed).toBe(1);
  });

  it("builds recentWorkouts keyed by sessionId, newest first, and a next workout with no id", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", startedAt: mkDate("2026-06-16"), completedAt: mkDate("2026-06-16") },
    ]);

    const result = run([enrollment], completions);

    expect(result.recentWorkouts.map((workout) => workout.id)).toStrictEqual(["s-tue", "s-mon"]);
    expect(result.recentWorkouts[0]?.title).toBe("Tue");
    expect(result.nextWorkout?.title).toBe("Thu");
    expect(result.nextWorkout).not.toHaveProperty("id");
  });

  it("tracks last activity date and days since last activity", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", startedAt: mkDate("2026-06-16"), completedAt: mkDate("2026-06-16") },
    ]);

    const result = run([enrollment], completions);

    expect(result.lastActivityDate?.getTime()).toBe(mkDate("2026-06-16").getTime());
    expect(result.daysSinceLastActivity).toBe(1);
  });
});

type DaySpec = { dayOfWeek: DayOfWeek; sessionId: string; rest?: boolean };

const dayFromSpec = (spec: DaySpec) => ({
  dayOfWeek: spec.dayOfWeek,
  label: spec.rest ? restLabel : workoutLabel(spec.sessionId),
  sessions: [{ id: spec.sessionId }],
});

const twoWeekEnrollment = (weekOneDays: DaySpec[], weekTwoDays: DaySpec[]) =>
  makeEnrollment({
    athleteId: ATHLETE,
    boardedAt: mkDate("2026-06-08"),
    weeks: [
      { id: "w-1", startDate: mkDate("2026-06-08"), days: weekOneDays.map(dayFromSpec) },
      { id: "w-2", startDate: mkDate(MONDAY), days: weekTwoDays.map(dayFromSpec) },
    ],
  });

const runTwoWeeks = (enrollment: WindowedEnrollment, performedByKey: PerformedByKey) =>
  computeAthleteMetrics({
    athleteId: ATHLETE,
    enrollments: [enrollment],
    performedByKey,
    weekCountByPlan: new Map([["plan-1", 2]]),
    firstWeekStartByPlan: firstWeekStarts([enrollment]),
    tz: TZ,
    now: NOW,
    startOfDayCache: createStartOfDayCache(TZ),
  });

describe("computeAthleteMetrics streak, delta and missed-day boundaries", () => {
  it("continues the streak across rest/no-schedule days and breaks on a missed day", () => {
    const enrollment = twoWeekEnrollment(
      [
        { dayOfWeek: DayOfWeek.SATURDAY, sessionId: "w1-sat" },
        { dayOfWeek: DayOfWeek.SUNDAY, sessionId: "w1-sun" },
      ],
      [
        { dayOfWeek: DayOfWeek.MONDAY, sessionId: "w2-mon", rest: true },
        { dayOfWeek: DayOfWeek.TUESDAY, sessionId: "w2-tue" },
      ],
    );
    const completions = performed(ATHLETE, [
      { sessionId: "w2-tue", startedAt: mkDate("2026-06-16"), completedAt: mkDate("2026-06-16") },
      { sessionId: "w1-sun", startedAt: mkDate("2026-06-14"), completedAt: mkDate("2026-06-14") },
    ]);

    const result = runTwoWeeks(enrollment, completions);

    expect(result.currentStreak).toBe(2);
  });

  it("counts consecutiveMissedDays at the WARNING boundary of 3", () => {
    const enrollment = twoWeekEnrollment(
      [{ dayOfWeek: DayOfWeek.SUNDAY, sessionId: "w1-sun" }],
      [
        { dayOfWeek: DayOfWeek.MONDAY, sessionId: "w2-mon" },
        { dayOfWeek: DayOfWeek.TUESDAY, sessionId: "w2-tue" },
      ],
    );

    const result = runTwoWeeks(enrollment, new Map());

    expect(result.consecutiveMissedDays).toBe(3);
  });

  it("counts consecutiveMissedDays at the CRITICAL boundary of 7", () => {
    const enrollment = twoWeekEnrollment(
      [
        { dayOfWeek: DayOfWeek.WEDNESDAY, sessionId: "w1-wed" },
        { dayOfWeek: DayOfWeek.THURSDAY, sessionId: "w1-thu" },
        { dayOfWeek: DayOfWeek.FRIDAY, sessionId: "w1-fri" },
        { dayOfWeek: DayOfWeek.SATURDAY, sessionId: "w1-sat" },
        { dayOfWeek: DayOfWeek.SUNDAY, sessionId: "w1-sun" },
      ],
      [
        { dayOfWeek: DayOfWeek.MONDAY, sessionId: "w2-mon" },
        { dayOfWeek: DayOfWeek.TUESDAY, sessionId: "w2-tue" },
      ],
    );

    const result = runTwoWeeks(enrollment, new Map());

    expect(result.consecutiveMissedDays).toBe(7);
  });

  it("returns a signed weeklyDelta comparing this week to last week", () => {
    const enrollment = twoWeekEnrollment(
      [
        { dayOfWeek: DayOfWeek.MONDAY, sessionId: "w1-mon" },
        { dayOfWeek: DayOfWeek.TUESDAY, sessionId: "w1-tue" },
      ],
      [
        { dayOfWeek: DayOfWeek.MONDAY, sessionId: "w2-mon" },
        { dayOfWeek: DayOfWeek.TUESDAY, sessionId: "w2-tue" },
      ],
    );
    const completions = performed(ATHLETE, [
      { sessionId: "w1-mon", startedAt: mkDate("2026-06-08"), completedAt: mkDate("2026-06-08") },
      { sessionId: "w2-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
      { sessionId: "w2-tue", startedAt: mkDate("2026-06-16"), completedAt: mkDate("2026-06-16") },
    ]);

    const result = runTwoWeeks(enrollment, completions);

    expect(result.weeklyDelta).toBe(50);
  });

  it("returns null weeklyDelta when last week had zero planned sessions", () => {
    const result = run([singleWeekEnrollment(fullWeekDays())], new Map());

    expect(result.weeklyDelta).toBeNull();
  });
});

describe("computeAthleteMetrics partial multi-session days", () => {
  const partialDayEnrollment = () =>
    makeEnrollment({
      athleteId: ATHLETE,
      boardedAt: mkDate(MONDAY),
      weeks: [
        {
          id: "w-1",
          startDate: mkDate(MONDAY),
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              label: workoutLabel("Strength"),
              sessions: [{ id: "mon-a" }, { id: "mon-b" }],
            },
          ],
        },
      ],
    });

  it("does not count a past day with some completed sessions as a missed day", () => {
    const completions = performed(ATHLETE, [
      { sessionId: "mon-a", startedAt: mkDate(MONDAY), completedAt: mkDate(MONDAY) },
    ]);

    const result = run([partialDayEnrollment()], completions);

    expect(result.consecutiveMissedDays).toBe(0);
    expect(result.currentStreak).toBe(1);
    expect(result.missedCount).toBe(1);
  });

  it("counts a past day with no completed sessions as a missed day", () => {
    const result = run([partialDayEnrollment()], new Map());

    expect(result.consecutiveMissedDays).toBe(1);
    expect(result.currentStreak).toBe(0);
    expect(result.missedCount).toBe(2);
  });
});

describe("computeAthleteMetrics last activity", () => {
  it("ignores in-progress sessions and reports null when nothing is completed", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const inProgress = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: null },
    ]);

    const result = run([enrollment], inProgress);

    expect(result.lastActivityDate).toBeNull();
    expect(result.daysSinceLastActivity).toBeNull();
  });

  it("never reports a negative days-since-last-activity", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", startedAt: mkDate("2026-06-15"), completedAt: mkDate("2026-06-15") },
    ]);

    const result = run([enrollment], completions);

    expect(result.daysSinceLastActivity).toBeGreaterThanOrEqual(0);
  });
});

describe("computeAthleteMetrics with multiple active plans (documents aggregation)", () => {
  const planA = makeEnrollment({
    id: "enrollment-a",
    planId: "plan-a",
    planName: "Strength Plan",
    athleteId: ATHLETE,
    boardedAt: mkDate(MONDAY),
    weeks: [
      {
        id: "wa-1",
        startDate: mkDate(MONDAY),
        days: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            label: workoutLabel("A-Mon"),
            sessions: [{ id: "a-mon" }],
          },
        ],
      },
    ],
  });

  const planB = makeEnrollment({
    id: "enrollment-b",
    planId: "plan-b",
    planName: "Conditioning Plan",
    athleteId: ATHLETE,
    boardedAt: mkDate("2026-06-16"),
    weeks: [
      {
        id: "wb-1",
        startDate: mkDate(MONDAY),
        days: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            label: workoutLabel("B-Mon"),
            sessions: [{ id: "b-mon" }],
          },
        ],
      },
    ],
  });

  const runMultiPlan = (performedByKey: PerformedByKey) =>
    computeAthleteMetrics({
      athleteId: ATHLETE,
      enrollments: [planA, planB],
      performedByKey,
      weekCountByPlan: new Map([
        ["plan-a", 1],
        ["plan-b", 1],
      ]),
      firstWeekStartByPlan: new Map([
        ["plan-a", mkDate(MONDAY)],
        ["plan-b", mkDate(MONDAY)],
      ]),
      tz: TZ,
      now: NOW,
      startOfDayCache: createStartOfDayCache(TZ),
    });

  it("aggregates planDiscipline and missed counts across the union of all active plans", () => {
    const result = runMultiPlan(new Map());

    expect(result.planDiscipline).toHaveLength(2);
    expect(result.missedCount).toBe(2);
    expect(result.adherenceRate).toBe(0);
  });

  it("picks the first enrollment whose week covers today as the primary plan", () => {
    const result = runMultiPlan(new Map());

    expect(result.primaryPlanId).toBe("plan-a");
    expect(result.primaryPlanName).toBe("Strength Plan");
  });
});
