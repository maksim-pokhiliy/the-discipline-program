import { describe, expect, it } from "vitest";

import {
  daySlotViewSchema,
  planTimetableResponseSchema,
  sessionCardViewSchema,
} from "./plan-timetable-api.schema";
import { TimetableSlotStatus } from "./plan-timetable.constants";

const VALID_CUID = "clz00000000000000000fake1";
const SECOND_CUID = "clz00000000000000000fake2";
const THIRD_CUID = "clz00000000000000000fake3";

const buildSessionCard = (overrides: Record<string, unknown> = {}) => ({
  sessionId: VALID_CUID,
  title: "Strength",
  subtitle: "Lower body",
  done: false,
  ...overrides,
});

const buildDaySlot = (overrides: Record<string, unknown> = {}) => ({
  date: "2026-06-15T00:00:00.000Z",
  dayOfWeek: "MONDAY",
  dayOfMonth: 15,
  isToday: true,
  isRestDay: false,
  status: TimetableSlotStatus.TODAY,
  sessions: [buildSessionCard()],
  ...overrides,
});

const buildWeek = (overrides: Record<string, unknown> = {}) => ({
  index: 0,
  startDate: "2026-06-15T00:00:00.000Z",
  days: [
    buildDaySlot(),
    buildDaySlot({
      date: "2026-06-16T00:00:00.000Z",
      dayOfWeek: "TUESDAY",
      dayOfMonth: 16,
      isToday: false,
      status: TimetableSlotStatus.DONE,
      sessions: [buildSessionCard({ sessionId: SECOND_CUID, done: true })],
    }),
    buildDaySlot({
      date: "2026-06-17T00:00:00.000Z",
      dayOfWeek: "WEDNESDAY",
      dayOfMonth: 17,
      isToday: false,
      status: TimetableSlotStatus.REST,
      sessions: [],
    }),
    buildDaySlot({
      date: "2026-06-18T00:00:00.000Z",
      dayOfWeek: "THURSDAY",
      dayOfMonth: 18,
      isToday: false,
      status: TimetableSlotStatus.TODO,
      sessions: [buildSessionCard({ sessionId: THIRD_CUID, subtitle: null, done: false })],
    }),
  ],
  ...overrides,
});

const buildPlan = (overrides: Record<string, unknown> = {}) => ({
  planId: VALID_CUID,
  planTitle: "Strength Cycle",
  todayWeekIndex: 0,
  landingWeekIndex: 0,
  weeks: [buildWeek()],
  ...overrides,
});

describe("planTimetableResponseSchema", () => {
  it("accepts an empty plan list", () => {
    expect(planTimetableResponseSchema.parse({ plans: [] })).toEqual({ plans: [] });
  });

  it("round-trips a populated fixture with mixed slot statuses and dayOfMonth", () => {
    const parsed = planTimetableResponseSchema.parse({ plans: [buildPlan()] });
    const plan = parsed.plans[0];

    expect(plan?.weeks[0]?.days).toHaveLength(4);
    expect(plan?.weeks[0]?.days.map((slot) => slot.status)).toEqual([
      TimetableSlotStatus.TODAY,
      TimetableSlotStatus.DONE,
      TimetableSlotStatus.REST,
      TimetableSlotStatus.TODO,
    ]);
    expect(plan?.weeks[0]?.days.map((slot) => slot.dayOfMonth)).toEqual([15, 16, 17, 18]);
  });

  it("coerces ISO date strings on date and startDate into Date instances", () => {
    const parsed = planTimetableResponseSchema.parse({ plans: [buildPlan()] });
    const week = parsed.plans[0]?.weeks[0];

    expect(week?.startDate).toBeInstanceOf(Date);
    expect(week?.startDate.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(week?.days[0]?.date).toBeInstanceOf(Date);
  });

  it("accepts a null todayWeekIndex (today outside the plan range)", () => {
    const result = planTimetableResponseSchema.safeParse({
      plans: [buildPlan({ todayWeekIndex: null })],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative landingWeekIndex", () => {
    const result = planTimetableResponseSchema.safeParse({
      plans: [buildPlan({ landingWeekIndex: -1 })],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-integer week index", () => {
    const result = planTimetableResponseSchema.safeParse({
      plans: [buildPlan({ weeks: [buildWeek({ index: 0.5 })] })],
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionCardViewSchema", () => {
  it("accepts a real cuid id with a nullable subtitle", () => {
    expect(sessionCardViewSchema.safeParse(buildSessionCard({ subtitle: null })).success).toBe(
      true,
    );
  });

  it("rejects a non-cuid session id", () => {
    expect(
      sessionCardViewSchema.safeParse(buildSessionCard({ sessionId: "not-a-cuid" })).success,
    ).toBe(false);
  });
});

describe("daySlotViewSchema", () => {
  it.each(Object.values(TimetableSlotStatus))("accepts slot status: %s", (status) => {
    expect(daySlotViewSchema.safeParse(buildDaySlot({ status })).success).toBe(true);
  });

  it("rejects an invalid status string", () => {
    expect(daySlotViewSchema.safeParse(buildDaySlot({ status: "skipped" })).success).toBe(false);
  });

  it("rejects a dayOfMonth below 1", () => {
    expect(daySlotViewSchema.safeParse(buildDaySlot({ dayOfMonth: 0 })).success).toBe(false);
  });

  it("rejects a dayOfMonth above 31", () => {
    expect(daySlotViewSchema.safeParse(buildDaySlot({ dayOfMonth: 32 })).success).toBe(false);
  });

  it("rejects a non-integer dayOfMonth", () => {
    expect(daySlotViewSchema.safeParse(buildDaySlot({ dayOfMonth: 15.5 })).success).toBe(false);
  });
});
