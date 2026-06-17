import { DayOfWeek, EnrollmentStatus, TrainingPlanStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { TimetableSlotStatus, type WeekTimetableView } from "@repo/contracts/lms/plan-timetable";

import { addDaysInTz, startOfDayInTz } from "../../../utils/date-helpers";

import {
  buildPlanTimetable,
  computeLandingWeekIndex,
  computeSlotStatus,
  computeTodayWeekIndex,
  deriveSubtitle,
} from "./build-plan-timetable";
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

const buildSingleWeekResult = (
  week: TimetableWeek,
  options: {
    tz?: string;
    now?: Date;
    performedSessionIds?: Set<string>;
  } = {},
) => {
  const tz = options.tz ?? UTC;

  return buildPlanTimetable({
    enrollments: [makeEnrollment({ weeks: [week] })],
    performedSessionIds: options.performedSessionIds ?? new Set<string>(),
    tz,
    now: options.now ?? new Date("2030-01-01T00:00:00.000Z"),
  });
};

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

    const result = buildSingleWeekResult(week);
    const days = result.plans[0]?.weeks[0]?.days ?? [];

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
  it("derives MONDAY at startDate and SUNDAY at startDate plus six in a non-UTC tz", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])]);
    const days = buildSingleWeekResult(week, { tz: NY }).plans[0]?.weeks[0]?.days ?? [];

    const expectedMonday = startOfDayInTz(addDaysInTz(mondayUtc, 0, NY), NY);
    const expectedSunday = startOfDayInTz(addDaysInTz(mondayUtc, 6, NY), NY);

    expect(days[0]?.date.getTime()).toBe(expectedMonday.getTime());
    expect(days[6]?.date.getTime()).toBe(expectedSunday.getTime());
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

describe("today and landing index", () => {
  const tz = UTC;
  const startOfDayCache = (date: Date): Date => startOfDayInTz(date, tz);

  const week = (startDate: Date): WeekTimetableView => ({
    index: 0,
    startDate,
    days: [],
  });

  const weeks: WeekTimetableView[] = [
    { ...week(new Date("2026-06-08T00:00:00.000Z")), index: 0 },
    { ...week(new Date("2026-06-15T00:00:00.000Z")), index: 1 },
    { ...week(new Date("2026-06-22T00:00:00.000Z")), index: 2 },
  ];

  it("returns the covering week index and matching landing index when today is inside", () => {
    const now = startOfDayInTz(new Date("2026-06-17T12:00:00.000Z"), tz);
    const todayIndex = computeTodayWeekIndex(weeks, now, tz, startOfDayCache);

    expect(todayIndex).toBe(1);
    expect(computeLandingWeekIndex(weeks, todayIndex, now, startOfDayCache)).toBe(1);
  });

  it("returns null today and landing index 0 when today is before the first week", () => {
    const now = startOfDayInTz(new Date("2026-06-01T00:00:00.000Z"), tz);
    const todayIndex = computeTodayWeekIndex(weeks, now, tz, startOfDayCache);

    expect(todayIndex).toBeNull();
    expect(computeLandingWeekIndex(weeks, todayIndex, now, startOfDayCache)).toBe(0);
  });

  it("returns null today and the last index when today is after the last week", () => {
    const now = startOfDayInTz(new Date("2026-07-15T00:00:00.000Z"), tz);
    const todayIndex = computeTodayWeekIndex(weeks, now, tz, startOfDayCache);

    expect(todayIndex).toBeNull();
    expect(computeLandingWeekIndex(weeks, todayIndex, now, startOfDayCache)).toBe(weeks.length - 1);
  });

  it("returns null today and landing index 0 for an empty week list", () => {
    const now = startOfDayInTz(new Date("2026-06-17T00:00:00.000Z"), tz);

    expect(computeTodayWeekIndex([], now, tz, startOfDayCache)).toBeNull();
    expect(computeLandingWeekIndex([], null, now, startOfDayCache)).toBe(0);
  });
});

describe("buildPlanTimetable today anchoring end-to-end", () => {
  it("flags the today slot and exposes the covering week as todayWeekIndex", () => {
    const week = makeWeek(mondayUtc, [makeDay(DayOfWeek.WEDNESDAY, [makeSession()])]);
    const now = new Date("2026-06-17T09:00:00.000Z");

    const plan = buildSingleWeekResult(week, { tz: UTC, now }).plans[0];
    const days = plan?.weeks[0]?.days ?? [];

    expect(plan?.todayWeekIndex).toBe(0);
    expect(plan?.landingWeekIndex).toBe(0);
    expect(days[2]?.isToday).toBe(true);
    expect(days[2]?.status).toBe(TimetableSlotStatus.TODAY);
    expect(days.filter((slot) => slot.isToday)).toHaveLength(1);
  });
});

describe("buildPlanTimetable date-thread", () => {
  const farFuture = new Date("2030-01-01T00:00:00.000Z");

  const twoWeekEnrollment = (
    hidePastBeforeBoarding: boolean,
    boardedAt: Date,
  ): TimetableEnrollment =>
    makeEnrollment({
      hidePastBeforeBoarding,
      boardedAt,
      weeks: [
        makeWeek(new Date("2026-06-08T00:00:00.000Z"), [
          makeDay(DayOfWeek.MONDAY, [makeSession()]),
          makeDay(DayOfWeek.THURSDAY, [makeSession()]),
        ]),
        makeWeek(new Date("2026-06-15T00:00:00.000Z"), [
          makeDay(DayOfWeek.MONDAY, [makeSession()]),
        ]),
      ],
    });

  it("returns the full tree when hidePastBeforeBoarding is false", () => {
    const result = buildPlanTimetable({
      enrollments: [twoWeekEnrollment(false, new Date("2026-06-11T00:00:00.000Z"))],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: farFuture,
    });

    expect(result.plans[0]?.weeks).toHaveLength(2);
    expect(result.plans[0]?.weeks[0]?.days).toHaveLength(7);
  });

  it("drops slots before boardedAt, keeps later slots, and never drops the future", () => {
    const result = buildPlanTimetable({
      enrollments: [twoWeekEnrollment(true, new Date("2026-06-11T00:00:00.000Z"))],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: farFuture,
    });

    const firstWeek = result.plans[0]?.weeks[0];

    expect(firstWeek?.days.every((slot) => slot.date.getTime() >= Date.UTC(2026, 5, 11))).toBe(
      true,
    );
    expect(firstWeek?.days.some((slot) => slot.dayOfWeek === "THURSDAY")).toBe(true);
    expect(firstWeek?.days.some((slot) => slot.dayOfWeek === "MONDAY")).toBe(false);
    expect(result.plans[0]?.weeks[1]?.days).toHaveLength(7);
  });

  it("drops a fully-emptied week and re-indexes survivors from zero", () => {
    const result = buildPlanTimetable({
      enrollments: [twoWeekEnrollment(true, new Date("2026-06-15T00:00:00.000Z"))],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: farFuture,
    });

    expect(result.plans[0]?.weeks).toHaveLength(1);
    expect(result.plans[0]?.weeks[0]?.index).toBe(0);
    expect(result.plans[0]?.weeks[0]?.startDate.toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });
});

describe("buildPlanTimetable multi-plan order", () => {
  it("preserves the input enrollment order without re-sorting", () => {
    const newer = makeEnrollment({
      planId: "clz0000000000000000planAA",
      planName: "Newer Plan",
      boardedAt: new Date("2026-06-15T00:00:00.000Z"),
      weeks: [makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])])],
    });
    const older = makeEnrollment({
      planId: "clz0000000000000000planBB",
      planName: "Older Plan",
      boardedAt: new Date("2026-05-01T00:00:00.000Z"),
      weeks: [makeWeek(mondayUtc, [makeDay(DayOfWeek.MONDAY, [makeSession()])])],
    });

    const result = buildPlanTimetable({
      enrollments: [newer, older],
      performedSessionIds: new Set<string>(),
      tz: UTC,
      now: new Date("2030-01-01T00:00:00.000Z"),
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
