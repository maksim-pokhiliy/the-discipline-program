import { DayOfWeek } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ProcessStatus, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

import { createStartOfDayCache, startOfDayInTz } from "../../../utils/date-helpers";

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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", performedAt: mkDate("2026-06-16") },
      { sessionId: "s-wed", performedAt: NOW },
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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", performedAt: mkDate("2026-06-16") },
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
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
      { sessionId: "s-tue", performedAt: mkDate("2026-06-16") },
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
      { sessionId: "w2-tue", performedAt: mkDate("2026-06-16") },
      { sessionId: "w1-sun", performedAt: mkDate("2026-06-14") },
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
      { sessionId: "w1-mon", performedAt: mkDate("2026-06-08") },
      { sessionId: "w2-mon", performedAt: mkDate("2026-06-15") },
      { sessionId: "w2-tue", performedAt: mkDate("2026-06-16") },
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
    const completions = performed(ATHLETE, [{ sessionId: "mon-a", performedAt: mkDate(MONDAY) }]);

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
  it("reports null when no session has been performed", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const none = performed(ATHLETE, []);

    const result = run([enrollment], none);

    expect(result.lastActivityDate).toBeNull();
    expect(result.daysSinceLastActivity).toBeNull();
  });

  it("never reports a negative days-since-last-activity", () => {
    const enrollment = singleWeekEnrollment(fullWeekDays());
    const completions = performed(ATHLETE, [
      { sessionId: "s-mon", performedAt: mkDate("2026-06-15") },
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

const NY_TZ = "America/New_York";

const nyMidnight = (isoDate: string): Date =>
  startOfDayInTz(new Date(`${isoDate}T12:00:00.000Z`), NY_TZ);

const fullWeekSpecs = (prefix: string): DaySpec[] => [
  { dayOfWeek: DayOfWeek.MONDAY, sessionId: `${prefix}-mon` },
  { dayOfWeek: DayOfWeek.TUESDAY, sessionId: `${prefix}-tue` },
  { dayOfWeek: DayOfWeek.WEDNESDAY, sessionId: `${prefix}-wed` },
  { dayOfWeek: DayOfWeek.THURSDAY, sessionId: `${prefix}-thu` },
  { dayOfWeek: DayOfWeek.FRIDAY, sessionId: `${prefix}-fri` },
  { dayOfWeek: DayOfWeek.SATURDAY, sessionId: `${prefix}-sat` },
  { dayOfWeek: DayOfWeek.SUNDAY, sessionId: `${prefix}-sun` },
];

const twoWeekTzEnrollment = (weekOneStart: Date, weekTwoStart: Date) =>
  makeEnrollment({
    athleteId: ATHLETE,
    boardedAt: weekOneStart,
    weeks: [
      { id: "w-1", startDate: weekOneStart, days: fullWeekSpecs("w1").map(dayFromSpec) },
      { id: "w-2", startDate: weekTwoStart, days: fullWeekSpecs("w2").map(dayFromSpec) },
    ],
  });

const runTz = (
  enrollment: WindowedEnrollment,
  performedByKey: PerformedByKey,
  now: Date,
  firstWeekStart: Date,
) =>
  computeAthleteMetrics({
    athleteId: ATHLETE,
    enrollments: [enrollment],
    performedByKey,
    weekCountByPlan: new Map([["plan-1", 2]]),
    firstWeekStartByPlan: new Map([["plan-1", firstWeekStart]]),
    tz: NY_TZ,
    now,
    startOfDayCache: createStartOfDayCache(NY_TZ),
  });

describe("computeAthleteMetrics across a DST boundary", () => {
  describe("spring-forward week (America/New_York, 2026-03-08 23h day)", () => {
    const weekOne = nyMidnight("2026-03-02");
    const weekTwo = nyMidnight("2026-03-09");
    const now = new Date("2026-03-09T16:00:00.000Z");

    it("anchors each week to local Monday midnight despite the offset shift", () => {
      expect(weekOne.toISOString()).toBe("2026-03-02T05:00:00.000Z");
      expect(weekTwo.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    });

    it("matches today to the post-transition Monday session, not off-by-one", () => {
      const completions = performed(ATHLETE, [{ sessionId: "w2-mon", performedAt: now }]);

      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), completions, now, weekOne);

      expect(result.todayStatus).toBe(TodayStatus.COMPLETED);
      expect(result.todayWorkoutTitle).toBe("w2-mon");
    });

    it("reports PENDING today when the post-transition Monday session is undone", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.todayStatus).toBe(TodayStatus.PENDING);
    });

    it("builds last7Days with one entry per civil day across the 23h boundary", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.last7Days).toHaveLength(LAST_7_DAYS);
      expect(result.last7Days.map((day) => day.date.toISOString())).toStrictEqual([
        "2026-03-03T05:00:00.000Z",
        "2026-03-04T05:00:00.000Z",
        "2026-03-05T05:00:00.000Z",
        "2026-03-06T05:00:00.000Z",
        "2026-03-07T05:00:00.000Z",
        "2026-03-08T05:00:00.000Z",
        "2026-03-09T04:00:00.000Z",
      ]);
    });

    it("derives currentWeek as 2 from the civil-day gap between week starts", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.currentWeek).toBe(2);
      expect(result.totalWeeks).toBe(2);
    });

    it("keeps the prior week's missed sessions inside the adherence and missed windows", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.missedCount).toBe(7);
      expect(result.missedThisWeek).toBe(0);
    });

    it("reports a non-negative days-since for a Sunday completion on the 23h day", () => {
      const sundayDone = new Date("2026-03-08T14:00:00.000Z");
      const completions = performed(ATHLETE, [{ sessionId: "w1-sun", performedAt: sundayDone }]);

      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), completions, now, weekOne);

      expect(result.lastActivityDate?.toISOString()).toBe("2026-03-08T14:00:00.000Z");
      expect(result.daysSinceLastActivity).toBe(0);
    });
  });

  describe("fall-back week (America/New_York, 2026-11-01 25h day)", () => {
    const weekOne = nyMidnight("2026-10-26");
    const weekTwo = nyMidnight("2026-11-02");
    const now = new Date("2026-11-02T17:00:00.000Z");

    it("anchors each week to local Monday midnight across the offset shift", () => {
      expect(weekOne.toISOString()).toBe("2026-10-26T04:00:00.000Z");
      expect(weekTwo.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    });

    it("matches today to the post-transition Monday session", () => {
      const completions = performed(ATHLETE, [{ sessionId: "w2-mon", performedAt: now }]);

      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), completions, now, weekOne);

      expect(result.todayStatus).toBe(TodayStatus.COMPLETED);
      expect(result.todayWorkoutTitle).toBe("w2-mon");
    });

    it("builds last7Days with one entry per civil day across the 25h boundary", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.last7Days.map((day) => day.date.toISOString())).toStrictEqual([
        "2026-10-27T04:00:00.000Z",
        "2026-10-28T04:00:00.000Z",
        "2026-10-29T04:00:00.000Z",
        "2026-10-30T04:00:00.000Z",
        "2026-10-31T04:00:00.000Z",
        "2026-11-01T04:00:00.000Z",
        "2026-11-02T05:00:00.000Z",
      ]);
    });

    it("derives currentWeek as 2 from the civil-day gap across the 25h week", () => {
      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), new Map(), now, weekOne);

      expect(result.currentWeek).toBe(2);
      expect(result.totalWeeks).toBe(2);
    });

    it("counts the Sunday 25h-day completion as one civil day before today", () => {
      const sundayDone = new Date("2026-11-01T17:00:00.000Z");
      const completions = performed(ATHLETE, [{ sessionId: "w1-sun", performedAt: sundayDone }]);

      const result = runTz(twoWeekTzEnrollment(weekOne, weekTwo), completions, now, weekOne);

      expect(result.daysSinceLastActivity).toBe(1);
    });
  });
});

describe("computeAthleteMetrics with non-contiguous plan weeks", () => {
  const gapWeekEnrollment = () =>
    makeEnrollment({
      athleteId: ATHLETE,
      boardedAt: mkDate("2026-06-01"),
      weeks: [
        {
          id: "w-1",
          startDate: mkDate("2026-06-01"),
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              label: workoutLabel("First"),
              sessions: [{ id: "g-1" }],
            },
          ],
        },
        {
          id: "w-3",
          startDate: mkDate(MONDAY),
          days: [
            {
              dayOfWeek: DayOfWeek.WEDNESDAY,
              label: workoutLabel("Third"),
              sessions: [{ id: "g-3" }],
            },
          ],
        },
      ],
    });

  it("derives currentWeek from calendar weeks since the first start, skipping the gap week", () => {
    const result = computeAthleteMetrics({
      athleteId: ATHLETE,
      enrollments: [gapWeekEnrollment()],
      performedByKey: new Map(),
      weekCountByPlan: new Map([["plan-1", 2]]),
      firstWeekStartByPlan: new Map([["plan-1", mkDate("2026-06-01")]]),
      tz: TZ,
      now: NOW,
      startOfDayCache: createStartOfDayCache(TZ),
    });

    expect(result.currentWeek).toBe(3);
    expect(result.totalWeeks).toBe(2);
  });
});
