import { alpha, type Theme } from "@mui/material";

import { TimetableSlotStatus, type WeekTimetableView } from "@repo/contracts/lms/plan-timetable";
import { DEFAULT_LOCALE, LAST_DAY_OFFSET_IN_WEEK } from "@repo/shared";

import {
  DONE_DATE_ALPHA,
  DONE_TITLE_ALPHA,
  DOT_FUTURE_ALPHA,
  DOT_PAST_ALPHA,
  DOT_W_CUR,
  DOT_W_OTHER,
  END_OF_PLAN_LABEL,
  NODE_HOLLOW_ALPHA,
  NODE_REST_ALPHA,
  NODE_SIZE_DONE_TODO,
  NODE_SIZE_REST,
  NODE_SIZE_TODAY,
  TODAY_GLOW_ALPHA,
  TRAIL_MUTED_ALPHA,
} from "./plan-timetable.constants";

export type NodeDecoration = {
  size: number;
  bg: string;
  border: string | undefined;
  shadow: string | undefined;
};

export type SlotDecoration = {
  dateColor: string;
  node: NodeDecoration;
};

export type TrailIconKind = "done" | "todo";

export type CardDecoration = {
  cardBorder: string;
  titleColor: string;
  trailIcon: TrailIconKind;
  trailColor: string;
  hoverBorder: string;
};

export type DotDecoration = {
  width: { xs: number; md: number };
  bg: string;
};

const resolveTodaySlot = (theme: Theme): SlotDecoration => ({
  dateColor: theme.palette.primary.main,
  node: {
    size: NODE_SIZE_TODAY,
    bg: theme.palette.primary.main,
    border: undefined,
    shadow: `0 0 0 4px ${alpha(theme.palette.primary.main, TODAY_GLOW_ALPHA)}`,
  },
});

const resolveDoneSlot = (theme: Theme): SlotDecoration => ({
  dateColor: alpha(theme.palette.common.white, DONE_DATE_ALPHA),
  node: {
    size: NODE_SIZE_DONE_TODO,
    bg: theme.palette.success.main,
    border: undefined,
    shadow: undefined,
  },
});

const resolveTodoSlot = (theme: Theme): SlotDecoration => ({
  dateColor: theme.palette.text.primary,
  node: {
    size: NODE_SIZE_DONE_TODO,
    bg: theme.palette.background.default,
    border: `2px solid ${alpha(theme.palette.common.white, NODE_HOLLOW_ALPHA)}`,
    shadow: undefined,
  },
});

const resolveRestSlot = (theme: Theme): SlotDecoration => ({
  dateColor: theme.palette.text.disabled,
  node: {
    size: NODE_SIZE_REST,
    bg: alpha(theme.palette.common.white, NODE_REST_ALPHA),
    border: undefined,
    shadow: undefined,
  },
});

export const resolveSlotDecoration = (
  status: TimetableSlotStatus,
  theme: Theme,
): SlotDecoration => {
  switch (status) {
    case TimetableSlotStatus.TODAY:
      return resolveTodaySlot(theme);
    case TimetableSlotStatus.DONE:
      return resolveDoneSlot(theme);
    case TimetableSlotStatus.TODO:
      return resolveTodoSlot(theme);
    case TimetableSlotStatus.REST:
      return resolveRestSlot(theme);
  }
};

export type CardDecorationArgs = {
  isToday: boolean;
  done: boolean;
};

export const resolveCardDecoration = (
  { isToday, done }: CardDecorationArgs,
  theme: Theme,
): CardDecoration => {
  const cardBorder = isToday
    ? `1.5px solid ${theme.palette.primary.main}`
    : `1px solid ${theme.palette.divider}`;

  const titleColor =
    done && !isToday
      ? alpha(theme.palette.common.white, DONE_TITLE_ALPHA)
      : theme.palette.text.primary;

  const trailColor = done
    ? theme.palette.success.main
    : isToday
      ? theme.palette.primary.main
      : alpha(theme.palette.common.white, TRAIL_MUTED_ALPHA);

  const hoverBorder = isToday
    ? theme.palette.primary.main
    : done
      ? theme.palette.dividerStrong
      : theme.palette.primary.main;

  return {
    cardBorder,
    titleColor,
    trailIcon: done ? "done" : "todo",
    trailColor,
    hoverBorder,
  };
};

export type DotStyleArgs = {
  index: number;
  viewedIndex: number;
  todayWeekIndex: number | null;
};

export const resolveDotStyle = (
  { index, viewedIndex, todayWeekIndex }: DotStyleArgs,
  theme: Theme,
): DotDecoration => {
  if (index === viewedIndex) {
    return { width: DOT_W_CUR, bg: theme.palette.primary.main };
  }

  if (todayWeekIndex !== null && index < todayWeekIndex) {
    return { width: DOT_W_OTHER, bg: alpha(theme.palette.common.white, DOT_PAST_ALPHA) };
  }

  return { width: DOT_W_OTHER, bg: alpha(theme.palette.common.white, DOT_FUTURE_ALPHA) };
};

export const formatWeekRangeCompact = (
  startDate: Date | string,
  locale: string = DEFAULT_LOCALE,
): string => {
  const start = new Date(startDate);
  const endDate = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + LAST_DAY_OFFSET_IN_WEEK,
    ),
  );
  const monthDayFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const dayFormat = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" });
  const isSameMonth = start.getUTCMonth() === endDate.getUTCMonth();
  const endLabel = isSameMonth ? dayFormat.format(endDate) : monthDayFormat.format(endDate);

  return `${monthDayFormat.format(start)} – ${endLabel}`;
};

const NEXT_WEEK_OFFSET = 2;

export const aheadHintLabel = (viewedIndex: number, weekCount: number): string =>
  viewedIndex < weekCount - 1 ? `Week ${viewedIndex + NEXT_WEEK_OFFSET} ahead` : END_OF_PLAN_LABEL;

export type WeekProgress = {
  done: number;
  total: number;
};

export const countWeekProgress = (week: WeekTimetableView): WeekProgress =>
  week.days.reduce<WeekProgress>(
    (acc, slot) => ({
      done: acc.done + slot.sessions.filter((card) => card.done).length,
      total: acc.total + slot.sessions.length,
    }),
    { done: 0, total: 0 },
  );
