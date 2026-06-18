import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import {
  type DaySlotView,
  type PlanTimetableResponse,
  type PlanTimetableView,
  type SessionCardView,
  TimetableSlotStatus,
  type WeekTimetableView,
} from "@repo/contracts/lms/plan-timetable";

import { DAY_OF_WEEK_TO_PRISMA } from "../_shared";

import {
  type TimetableDay,
  type TimetableEnrollment,
  type TimetableSession,
} from "./plan-timetable.types";

const DEFAULT_WORKOUT_TITLE = "Workout";

const DEFAULT_LANDING_WEEK_INDEX = 0;

const DAYS_PER_WEEK = dayOfWeekValues.length;

const SUNDAY_DAYS_FROM_MONDAY = 6;

const FORWARD_HORIZON_WEEKS = 6;

type WeekSource = {
  startDate: Date;
  days: TimetableDay[];
};

type BuildPlanTimetableArgs = {
  enrollments: TimetableEnrollment[];
  performedSessionIds: Set<string>;
  tz: string;
  now: Date;
};

type SlotStatusArgs = {
  isToday: boolean;
  sessions: SessionCardView[];
};

const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const mondayOfUtc = (date: Date): Date => {
  const weekday = date.getUTCDay();
  const offsetToMonday = weekday === 0 ? SUNDAY_DAYS_FROM_MONDAY : weekday - 1;

  return addUtcDays(date, -offsetToMonday);
};

const weekMondayOf = (date: Date): Date => mondayOfUtc(toUtcMidnight(date));

const athleteTodayUtc = (now: Date, tz: string): Date => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year = "0", month = "0", day = "0"] = formatter.format(now).split("-");

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

const isRestSession = (session: TimetableSession): boolean => session.label?.rest === true;

const composeSlotTitle = (session: TimetableSession, day: TimetableDay | null): string =>
  session.label?.name ?? day?.label?.name ?? DEFAULT_WORKOUT_TITLE;

export const deriveSubtitle = (
  session: TimetableSession,
  day: TimetableDay | null,
): string | null => {
  const title = composeSlotTitle(session, day);
  const dayName = day?.label?.name ?? null;

  return dayName !== null && dayName !== title ? dayName : null;
};

export const computeSlotStatus = ({ isToday, sessions }: SlotStatusArgs): TimetableSlotStatus => {
  if (isToday) {
    return TimetableSlotStatus.TODAY;
  }

  if (sessions.length === 0) {
    return TimetableSlotStatus.REST;
  }

  if (sessions.every((session) => session.done)) {
    return TimetableSlotStatus.DONE;
  }

  return TimetableSlotStatus.TODO;
};

const buildSessionCards = (
  day: TimetableDay | null,
  performedSessionIds: Set<string>,
): SessionCardView[] => {
  if (day === null || day.label?.rest === true) {
    return [];
  }

  return day.sessions
    .filter((session) => !isRestSession(session))
    .map((session) => ({
      sessionId: session.id,
      title: composeSlotTitle(session, day),
      subtitle: deriveSubtitle(session, day),
      done: performedSessionIds.has(session.id),
    }));
};

const buildDaySlots = (
  week: WeekSource,
  performedSessionIds: Set<string>,
  todayUtc: Date,
): DaySlotView[] => {
  const monday = toUtcMidnight(week.startDate);
  const dayMap = new Map(week.days.map((day) => [day.dayOfWeek, day]));

  return dayOfWeekValues.map((dayOfWeek, offset) => {
    const date = addUtcDays(monday, offset);
    const day = dayMap.get(DAY_OF_WEEK_TO_PRISMA[dayOfWeek]) ?? null;
    const sessions = buildSessionCards(day, performedSessionIds);
    const isToday = date.getTime() === todayUtc.getTime();

    return {
      date,
      dayOfWeek,
      dayOfMonth: date.getUTCDate(),
      isToday,
      status: computeSlotStatus({ isToday, sessions }),
      sessions,
    };
  });
};

const computeWeekSpan = (
  enrollment: TimetableEnrollment,
  todayMonday: Date,
): { low: number; high: number } => {
  const todayTime = todayMonday.getTime();
  const authoredMondays = enrollment.plan.weeks.map((week) =>
    weekMondayOf(week.startDate).getTime(),
  );
  const forwardHorizon = addUtcDays(todayMonday, FORWARD_HORIZON_WEEKS * DAYS_PER_WEEK).getTime();
  const low = Math.min(todayTime, ...authoredMondays);
  const high = Math.max(forwardHorizon, ...authoredMondays);

  if (!enrollment.hidePastBeforeBoarding) {
    return { low, high };
  }

  const boardedMonday = weekMondayOf(enrollment.boardedAt).getTime();

  return { low: Math.max(low, boardedMonday), high };
};

const buildWeeks = (
  enrollment: TimetableEnrollment,
  performedSessionIds: Set<string>,
  todayMonday: Date,
  todayUtc: Date,
): { weeks: WeekTimetableView[]; todayWeekIndex: number | null } => {
  const { low, high } = computeWeekSpan(enrollment, todayMonday);
  const daysByMonday = new Map(
    enrollment.plan.weeks.map((week) => [weekMondayOf(week.startDate).getTime(), week.days]),
  );
  const weeks: WeekTimetableView[] = [];
  let todayWeekIndex: number | null = null;
  let cursor = low;

  while (cursor <= high) {
    const monday = new Date(cursor);
    const source: WeekSource = { startDate: monday, days: daysByMonday.get(cursor) ?? [] };
    const index = weeks.length;

    if (cursor === todayMonday.getTime()) {
      todayWeekIndex = index;
    }

    weeks.push({
      index,
      startDate: monday,
      days: buildDaySlots(source, performedSessionIds, todayUtc),
    });
    cursor = addUtcDays(monday, DAYS_PER_WEEK).getTime();
  }

  return { weeks, todayWeekIndex };
};

const buildPlanForEnrollment = (
  enrollment: TimetableEnrollment,
  performedSessionIds: Set<string>,
  todayMonday: Date,
  todayUtc: Date,
): PlanTimetableView => {
  const { weeks, todayWeekIndex } = buildWeeks(
    enrollment,
    performedSessionIds,
    todayMonday,
    todayUtc,
  );

  return {
    planId: enrollment.planId,
    planTitle: enrollment.plan.name,
    todayWeekIndex,
    landingWeekIndex: todayWeekIndex ?? DEFAULT_LANDING_WEEK_INDEX,
    weeks,
  };
};

export const buildPlanTimetable = ({
  enrollments,
  performedSessionIds,
  tz,
  now,
}: BuildPlanTimetableArgs): PlanTimetableResponse => {
  const todayUtc = athleteTodayUtc(now, tz);
  const todayMonday = mondayOfUtc(todayUtc);
  const plans = enrollments.map((enrollment) =>
    buildPlanForEnrollment(enrollment, performedSessionIds, todayMonday, todayUtc),
  );

  return { plans };
};
