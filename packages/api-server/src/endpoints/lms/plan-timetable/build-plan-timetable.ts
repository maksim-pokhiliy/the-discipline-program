import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import {
  type DaySlotView,
  type PlanTimetableResponse,
  type PlanTimetableView,
  type SessionCardView,
  TimetableSlotStatus,
  type WeekTimetableView,
} from "@repo/contracts/lms/plan-timetable";

import { addDaysInTz, createStartOfDayCache, DAYS_IN_WEEK } from "../../../utils/date-helpers";
import { DAY_OF_WEEK_TO_PRISMA } from "../_shared";

import {
  type TimetableDay,
  type TimetableEnrollment,
  type TimetableSession,
  type TimetableWeek,
} from "./plan-timetable.types";

const DEFAULT_WORKOUT_TITLE = "Workout";

const DEFAULT_LANDING_WEEK_INDEX = 0;

type StartOfDayCache = (date: Date) => Date;

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

const buildWeekSlots = (
  week: TimetableWeek,
  performedSessionIds: Set<string>,
  tz: string,
  startOfToday: Date,
  startOfDayCache: StartOfDayCache,
): DaySlotView[] => {
  const dayMap = new Map(week.days.map((day) => [day.dayOfWeek, day]));

  return dayOfWeekValues.map((dayOfWeek, offset) => {
    const date = startOfDayCache(addDaysInTz(week.startDate, offset, tz));
    const day = dayMap.get(DAY_OF_WEEK_TO_PRISMA[dayOfWeek]) ?? null;
    const sessions = buildSessionCards(day, performedSessionIds);
    const isToday = date.getTime() === startOfToday.getTime();

    return { date, dayOfWeek, isToday, status: computeSlotStatus({ isToday, sessions }), sessions };
  });
};

const buildWeeks = (
  enrollment: TimetableEnrollment,
  performedSessionIds: Set<string>,
  tz: string,
  startOfToday: Date,
  startOfDayCache: StartOfDayCache,
): WeekTimetableView[] =>
  enrollment.plan.weeks.map((week, index) => ({
    index,
    startDate: week.startDate,
    days: buildWeekSlots(week, performedSessionIds, tz, startOfToday, startOfDayCache),
  }));

const applyDateThread = (
  weeks: WeekTimetableView[],
  hidePastBeforeBoarding: boolean,
  boardedAtDay: Date,
): WeekTimetableView[] => {
  if (!hidePastBeforeBoarding) {
    return weeks;
  }

  return weeks
    .map((week) => ({
      ...week,
      days: week.days.filter((slot) => slot.date.getTime() >= boardedAtDay.getTime()),
    }))
    .filter((week) => week.days.length > 0)
    .map((week, index) => ({ ...week, index }));
};

const weekCoversToday = (
  weekStart: Date,
  startOfToday: Date,
  tz: string,
  startOfDayCache: StartOfDayCache,
): boolean => {
  const normalizedStart = startOfDayCache(weekStart);
  const weekEnd = startOfDayCache(addDaysInTz(normalizedStart, DAYS_IN_WEEK, tz));

  return startOfToday >= normalizedStart && startOfToday < weekEnd;
};

export const computeTodayWeekIndex = (
  weeks: WeekTimetableView[],
  startOfToday: Date,
  tz: string,
  startOfDayCache: StartOfDayCache,
): number | null => {
  const index = weeks.findIndex((week) =>
    weekCoversToday(week.startDate, startOfToday, tz, startOfDayCache),
  );

  return index === -1 ? null : index;
};

export const computeLandingWeekIndex = (
  weeks: WeekTimetableView[],
  todayWeekIndex: number | null,
  startOfToday: Date,
  startOfDayCache: StartOfDayCache,
): number => {
  if (todayWeekIndex !== null) {
    return todayWeekIndex;
  }

  const firstWeek = weeks[0];

  if (firstWeek === undefined) {
    return DEFAULT_LANDING_WEEK_INDEX;
  }

  const isBeforePlan = startOfToday.getTime() < startOfDayCache(firstWeek.startDate).getTime();

  return isBeforePlan ? DEFAULT_LANDING_WEEK_INDEX : weeks.length - 1;
};

const buildPlanForEnrollment = (
  enrollment: TimetableEnrollment,
  performedSessionIds: Set<string>,
  tz: string,
  startOfToday: Date,
  startOfDayCache: StartOfDayCache,
): PlanTimetableView => {
  const boardedAtDay = startOfDayCache(enrollment.boardedAt);
  const allWeeks = buildWeeks(enrollment, performedSessionIds, tz, startOfToday, startOfDayCache);
  const weeks = applyDateThread(allWeeks, enrollment.hidePastBeforeBoarding, boardedAtDay);
  const todayWeekIndex = computeTodayWeekIndex(weeks, startOfToday, tz, startOfDayCache);

  return {
    planId: enrollment.planId,
    planTitle: enrollment.plan.name,
    todayWeekIndex,
    landingWeekIndex: computeLandingWeekIndex(weeks, todayWeekIndex, startOfToday, startOfDayCache),
    weeks,
  };
};

export const buildPlanTimetable = ({
  enrollments,
  performedSessionIds,
  tz,
  now,
}: BuildPlanTimetableArgs): PlanTimetableResponse => {
  const startOfDayCache = createStartOfDayCache(tz);
  const startOfToday = startOfDayCache(now);
  const plans = enrollments.map((enrollment) =>
    buildPlanForEnrollment(enrollment, performedSessionIds, tz, startOfToday, startOfDayCache),
  );

  return { plans };
};
