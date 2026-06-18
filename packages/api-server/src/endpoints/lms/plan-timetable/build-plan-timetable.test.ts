import { DayOfWeek, EnrollmentStatus, TrainingPlanStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { TimetableSlotStatus } from "@repo/contracts/lms/plan-timetable";

import { buildPlanTimetable, computeSlotStatus, deriveSubtitle } from "./build-plan-timetable";
import {
  type TimetableDay,
  type TimetableEnrollment,
  type TimetableSession,
  type TimetableWeek,
} from "./plan-timetable.types";

const EPOCH = new Date("2026-01-01T00:00:00.000Z");
const UTC = "UTC";
const NY = "America/New_York";
const TOKYO = "Asia/Tokyo";

type LabelStub = { name: string; rest: boolean } | null;

let sessionCounter = 0;

const nextSessionId = (): string => {
  sessionCounter += 1;

  return `clz0000000000000000sess${String(sessionCounter).padStart(2, "0")}`;
};

const makeSession = (overrides: { id?: string; label?: LabelStub } = {}): TimetableSession => ({
  id: overrides.id ?? nextSessionId(),
  dayId: "clz00000000000000000day01",
  order: 0,
  labelId: null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  label: overrides.label ?? null,
});

const makeDay = (
  dayOfWeek: DayOfWeek,
  sessions: TimetableSession[],
  label: LabelStub = null,
): TimetableDay => ({
  id: `clz0000000000000000day${dayOfWeek.slice(0, 3).toLowerCase()}`,
  weekId: "clz00000000000000000wk001",
  dayOfWeek,
  labelId: null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  label,
  sessions,
});

const makeWeek = (startDate: Date, days: TimetableDay[]): TimetableWeek => ({
  id: `clz00000000000000000wk${startDate.getUTCDate().toString().padStart(3, "0")}`,
  planId: "clz0000000000000000plan01",
  startDate,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  days,
});

type EnrollmentOptions = {
  planId?: string;
  planName?: string;
  boardedAt?: Date;
  hidePastBeforeBoarding?: boolean;
  weeks: TimetableWeek[];
};

const makeEnrollment = (options: EnrollmentOptions): TimetableEnrollment => {
  const planId = options.planId ?? "clz0000000000000000plan01";

  return {
    id: "clz0000000000000000enr001",
    planId,
    athleteId: "clz0000000000000000athl01",
    enrolledById: "clz0000000000000000coach1",
    boardedAt: options.boardedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    status: EnrollmentStatus.ACTIVE,
    statusChangedAt: EPOCH,
    hidePastBeforeBoarding: options.hidePastBeforeBoarding ?? false,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    deletedAt: null,
    plan: {
      id: planId,
      creatorId: "clz0000000000000000coach1",
      status: TrainingPlanStatus.ACTIVE,
      name: options.planName ?? "Strength Cycle",
      description: null,
      createdAt: EPOCH,
      updatedAt: EPOCH,
      deletedAt: null,
      weeks: options.weeks,
    },
  };
};

const workoutLabel = (name: string): LabelStub => ({ name, rest: false });
const restLabel = (name: string): LabelStub => ({ name, rest: true });

const mondayUtc = new Date("2026-06-15T00:00:00.000Z");
const wednesday = new Date("2026-06-17T00:00:00.000Z");

// A `now` a few weeks after the authored week, so weeks[0] is the authored week
// with no "today" slot — keeps the static status assertions clean.
const FUTURE_NOW = new Date("2026-07-13T00:00:00.000Z");

const buildSingleWeekResult = (
  week: TimetableWeek,
  options: {
    tz?: string;
    now?: Date;
    performedSessionIds?: Set<string>;
  } = {},
) =>
  buildPlanTimetable({
    enrollments: [makeEnrollment({ weeks: [week] })],
    performedSessionIds: options.performedSessionIds ?? new Set<string>(),
    tz: options.tz ?? UTC,
    now: options.now ?? FUTURE_NOW,
  });

describe("computeSlotStatus", () => {
  it("returns TODAY even when every session is done", () => {
    const sessions = [{ sessionId: "s1", title: "t", subtitle: null, done: true }];

    expect(computeSlotStatus({ isToday: true, sessions })).toBe(TimetableSlotStatus.TODAY);
  });

  it("returns REST when there are no sessions", () => {
    expect(computeSlotStatus({ isToday: false, sessions: [] })).toBe(TimetableSlotStatus.REST);
  });

  it("returns DONE when all non-today sessions are done", () => {
    const sessions = [
      { sessionId: "s1", title: "t", subtitle: null, done: true },
      { sessionId: "s2", title: "t", subtitle: null, done: true },
    ];

    expect(computeSlotStatus({ isToday: false, sessions })).toBe(TimetableSlotStatus.DONE);
  });

  it("returns TODO when at least one session is not done", () => {
    const sessions = [
      { sessionId: "s1", title: "t", subtitle: null, done: true },
      { sessionId: "s2", title: "t", subtitle: null, done: false },
    ];

    expect(computeSlotStatus({ isToday: false, sessions })).toBe(TimetableSlotStatus.TODO);
  });
});

describe("buildPlanTimetable slot materialization", () => {
  it("materializes seven Monday-to-Sunday slots from a sparse week", () => {
    const week = makeWeek(mondayUtc, [
      makeDay(DayOfWeek.WEDNESDAY, [makeSession()], workoutLabel("Wednesday")),
      makeDay(DayOfWeek.FRIDAY, [makeSession()], workoutLabel("Friday")),
    ]);

    const days = buildSingleWeekResult(week).plans[0]?.weeks[0]?.days ?? [];

    expect(days).toHaveLength(7);
    expect(days.map((slot) => slot.dayOfWeek)).toEqual([...dayOfWeekValues]);
    expect(days.filter((slot) => slot.status === TimetableSlotStatus.REST)).toHaveLength(5);
    expect(days[2]?.status).toBe(TimetableSlotStatus.TODO);
    expect(days[4]?.status).toBe(TimetableSlotStatus.TODO);
  });

  it("treats a rest-labelled day and an all-rest-session day as REST", () => {
    const week = makeWeek(mondayUtc, [
      makeDay(DayOfWeek.MONDAY, [makeSession()], restLabel("Active recovery")),
      makeDay(DayOfWeek.TUESDAY, [makeSession({ label: restLabel("Mobility") })]),
    ]);

    const days = buildSingleWeekResult(week).plans[0]?.weeks[0]?.days ?? [];

    expect(days[0]?.status).toBe(TimetableSlotStatus.REST);
    expect(days[0]?.sessions).toHaveLength(0);
    expect(days[1]?.status).toBe(TimetableSlotStatus.REST);
  });
});

describe("buildPlanTimetable per-day date derivation", () => {
  it("emits each slot date as the absolute UTC-midnight calendar date", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);
    const days = buildSingleWeekResult(week, { tz: NY }).plans[0]?.weeks[0]?.days ?? [];

    expect(days[0]?.date.getTime()).toBe(Date.UTC(2026, 5, 15));
    expect(days[6]?.date.getTime()).toBe(Date.UTC(2026, 5, 21));
    expect(days[0]?.dayOfWeek).toBe("MONDAY");
  });

  it("emits the same absolute dayOfMonth in a UTC-plus and a UTC-minus tz", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);

    const tokyoDays = buildSingleWeekResult(week, { tz: TOKYO }).plans[0]?.weeks[0]?.days ?? [];
    const nyDays = buildSingleWeekResult(week, { tz: NY }).plans[0]?.weeks[0]?.days ?? [];

    expect(tokyoDays.map((slot) => slot.dayOfMonth)).toEqual([15, 16, 17, 18, 19, 20, 21]);
    expect(nyDays.map((slot) => slot.dayOfMonth)).toEqual(tokyoDays.map((slot) => slot.dayOfMonth));
  });

  it("rolls dayOfMonth across a month boundary", () => {
    const lateJune = new Date("2026-06-29T00:00:00.000Z");
    const week = makeWeek(lateJune, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);
    const days = buildSingleWeekResult(week, { tz: NY }).plans[0]?.weeks[0]?.days ?? [];

    expect(days.map((slot) => slot.dayOfMonth)).toEqual([29, 30, 1, 2, 3, 4, 5]);
  });
});

describe("buildPlanTimetable done derivation", () => {
  it("flips a card to done when its session id is in the performed set", () => {
    const performedId = "clz0000000000000000perf01";
    const week = makeWeek(mondayUtc, [
      makeDay(DayOfWeek.MONDAY, [
        makeSession({ id: performedId }),
        makeSession({ id: "clz0000000000000000notdone" }),
      ]),
    ]);

    const days =
      buildSingleWeekResult(week, {
        performedSessionIds: new Set([performedId]),
      }).plans[0]?.weeks[0]?.days ?? [];

    const cards = days[0]?.sessions ?? [];

    expect(cards.find((card) => card.sessionId === performedId)?.done).toBe(true);
    expect(cards.find((card) => card.sessionId === "clz0000000000000000notdone")?.done).toBe(false);
    expect(days[0]?.status).toBe(TimetableSlotStatus.TODO);
  });

  it("marks a non-today slot DONE when every session is performed", () => {
    const a = "clz0000000000000000donea1";
    const b = "clz0000000000000000doneb1";
    const week = makeWeek(mondayUtc, [
      makeDay(DayOfWeek.MONDAY, [makeSession({ id: a }), makeSession({ id: b })]),
    ]);

    const days =
      buildSingleWeekResult(week, {
        performedSessionIds: new Set([a, b]),
      }).plans[0]?.weeks[0]?.days ?? [];

    expect(days[0]?.status).toBe(TimetableSlotStatus.DONE);
  });
});

describe("deriveSubtitle", () => {
  it("uses the day label as subtitle when the session has its own distinct label", () => {
    const day = makeDay(DayOfWeek.MONDAY, [], workoutLabel("Lower Body"));
    const session = makeSession({ label: workoutLabel("Back Squat") });

    expect(deriveSubtitle(session, day)).toBe("Lower Body");
  });

  it("returns null when the title came from the day label (no echo)", () => {
    const day = makeDay(DayOfWeek.MONDAY, [], workoutLabel("Lower Body"));
    const session = makeSession({ label: null });

    expect(deriveSubtitle(session, day)).toBeNull();
  });

  it("returns null when the session and day labels are identical", () => {
    const day = makeDay(DayOfWeek.MONDAY, [], workoutLabel("Engine"));
    const session = makeSession({ label: workoutLabel("Engine") });

    expect(deriveSubtitle(session, day)).toBeNull();
  });
});

describe("buildPlanTimetable time-anchored week axis", () => {
  it("renders the current calendar week scaffold for a plan with no authored weeks", () => {
    const result = buildPlanTimetable({
      enrollments: [makeEnrollment({ weeks: [] })],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: wednesday,
    });
    const plan = result.plans[0];
    const week = plan?.weeks[0];

    expect(plan?.weeks.length).toBeGreaterThan(1);
    expect(week?.startDate.getTime()).toBe(mondayUtc.getTime());
    expect(week?.days).toHaveLength(7);
    expect(week?.days.every((slot) => slot.sessions.length === 0)).toBe(true);
    expect(plan?.todayWeekIndex).toBe(0);
    expect(plan?.landingWeekIndex).toBe(0);
    expect(week?.days.filter((slot) => slot.isToday)).toHaveLength(1);
    expect(week?.days[2]?.isToday).toBe(true);
  });

  it("fills a contiguous span from a past authored week through the current week", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);

    const plan = buildPlanTimetable({
      enrollments: [makeEnrollment({ weeks: [week] })],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: new Date("2026-06-29T00:00:00.000Z"),
    }).plans[0];

    expect(plan?.weeks.length).toBeGreaterThanOrEqual(3);
    expect(plan?.weeks[0]?.startDate.getTime()).toBe(mondayUtc.getTime());
    expect(plan?.weeks[0]?.days[0]?.status).toBe(TimetableSlotStatus.TODO);
    expect(plan?.weeks[1]?.days.every((slot) => slot.sessions.length === 0)).toBe(true);
    expect(plan?.todayWeekIndex).toBe(2);
    expect(plan?.landingWeekIndex).toBe(2);
  });

  it("anchors today inside an authored current week", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.WEDNESDAY, [makeSession()])]);

    const plan = buildSingleWeekResult(week, { tz: UTC, now: wednesday }).plans[0];
    const days = plan?.weeks[0]?.days ?? [];

    expect(plan?.weeks.length).toBeGreaterThanOrEqual(1);
    expect(plan?.todayWeekIndex).toBe(0);
    expect(days[2]?.isToday).toBe(true);
    expect(days[2]?.status).toBe(TimetableSlotStatus.TODAY);
    expect(days.filter((slot) => slot.isToday)).toHaveLength(1);
  });
});

describe("buildPlanTimetable date-thread (week-granular)", () => {
  const twoAuthoredWeeks = (
    hidePastBeforeBoarding: boolean,
    boardedAt: Date,
  ): TimetableEnrollment =>
    makeEnrollment({
      hidePastBeforeBoarding,
      boardedAt,
      weeks: [
        makeWeek(new Date("2026-06-08T00:00:00.000Z"), [
          makeDay(DayOfWeek.MONDAY, [makeSession()]),
        ]),
        makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]),
      ],
    });

  it("shows authored weeks plus the current week when hidePastBeforeBoarding is false", () => {
    const result = buildPlanTimetable({
      enrollments: [twoAuthoredWeeks(false, new Date("2026-06-11T00:00:00.000Z"))],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: wednesday,
    });

    expect(result.plans[0]?.weeks.length).toBeGreaterThanOrEqual(2);
    expect(result.plans[0]?.weeks[0]?.startDate.getTime()).toBe(Date.UTC(2026, 5, 8));
    expect(result.plans[0]?.todayWeekIndex).toBe(1);
  });

  it("clamps the span to the boarding week, hiding the earlier archive week", () => {
    const result = buildPlanTimetable({
      enrollments: [twoAuthoredWeeks(true, mondayUtc)],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: wednesday,
    });

    expect(result.plans[0]?.weeks.length).toBeGreaterThanOrEqual(1);
    expect(result.plans[0]?.weeks[0]?.index).toBe(0);
    expect(result.plans[0]?.weeks[0]?.startDate.getTime()).toBe(mondayUtc.getTime());
  });
});

describe("buildPlanTimetable multi-plan order", () => {
  it("preserves the input enrollment order without re-sorting", () => {
    const week = (): TimetableWeek =>
      makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);
    const newer = makeEnrollment({
      planId: "clz0000000000000000planAA",
      planName: "Newer Plan",
      weeks: [week()],
    });
    const older = makeEnrollment({
      planId: "clz0000000000000000planBB",
      planName: "Older Plan",
      weeks: [week()],
    });

    const result = buildPlanTimetable({
      enrollments: [newer, older],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: wednesday,
    });

    expect(result.plans.map((plan) => plan.planTitle)).toEqual(["Newer Plan", "Older Plan"]);
  });
});

describe("dayOfWeekValues invariant", () => {
  it("is Monday-first so the offset-zero slot maps to Monday (guards QA-008)", () => {
    expect(dayOfWeekValues[0]).toBe("MONDAY");

    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);
    const days = buildSingleWeekResult(week, { tz: UTC }).plans[0]?.weeks[0]?.days ?? [];

    expect(days[0]?.dayOfWeek).toBe("MONDAY");
    expect(days[0]?.dayOfMonth).toBe(15);
  });
});
