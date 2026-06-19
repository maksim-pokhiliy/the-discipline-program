import { type ReactElement, type RefObject } from "react";

import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { alpha, Box, Stack, Typography, useTheme } from "@mui/material";

import { type DaySlotView } from "@repo/contracts/lms/plan-timetable";

import {
  DATE_COL_W,
  DATE_LINE_GAP,
  DAY_NUM_PX,
  DAY_OF_WEEK_SHORT,
  EMPTY_DAY_LABEL,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  RAIL_ALPHA,
  RAIL_WIDTH_PX,
  REST_DAY_LABEL,
  REST_DAY_PX,
  SCROLL_ANCHOR_OFFSET_PX,
  TIMELINE_COL_W,
  TIMELINE_CONTENT_PB,
  TIMELINE_CONTENT_PT,
  TIMELINE_CONTENT_PX,
  TIMELINE_DATE_PT,
  TIMELINE_DOT_OFFSET,
  WEEK_LABEL_LETTER_SPACING,
  WEEKDAY_LETTER_SPACING,
  WEEKDAY_PX,
} from "../utils/plan-timetable.constants";
import { resolveCardDecoration, resolveSlotDecoration } from "../utils/timetable-presentation";

import { RestDayCard } from "./rest-day-card";
import { SessionCard } from "./session-card";

export type DayRowProps = {
  slot: DaySlotView;
  todayRowRef: RefObject<HTMLLIElement | null>;
  onOpenSession: (sessionId: string) => void;
};

export const DayRow = ({ slot, todayRowRef, onOpenSession }: DayRowProps): ReactElement => {
  const theme = useTheme();
  const { dateColor, node } = resolveSlotDecoration(slot.status, theme);
  const hasSessions = slot.sessions.length > 0;
  const railColor = alpha(theme.palette.common.white, RAIL_ALPHA);

  return (
    <TimelineItem
      ref={slot.isToday ? todayRowRef : null}
      sx={{
        minHeight: 0,
        "&::before": { display: "none" },
        scrollMarginTop: slot.isToday ? `${SCROLL_ANCHOR_OFFSET_PX}px` : undefined,
      }}
    >
      <TimelineOppositeContent
        sx={{
          flex: "0 0 auto",
          width: DATE_COL_W,
          mr: DATE_LINE_GAP,
          px: 0,
          py: 0,
          pt: TIMELINE_DATE_PT,
        }}
      >
        <Stack spacing={0} alignItems="flex-end">
          <Typography
            component="span"
            sx={{
              fontSize: (t) => t.typography.pxToRem(WEEKDAY_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: WEEKDAY_LETTER_SPACING,
              textTransform: "uppercase",
              color: dateColor,
            }}
          >
            {DAY_OF_WEEK_SHORT[slot.dayOfWeek]}
          </Typography>
          <Box
            component="span"
            sx={(t) => ({
              fontFamily: "var(--font-display)",
              fontWeight: FONT_WEIGHT_DISPLAY,
              fontSize: {
                xs: t.typography.pxToRem(DAY_NUM_PX.xs),
                md: t.typography.pxToRem(DAY_NUM_PX.md),
              },
              lineHeight: 1,
              letterSpacing: WEEK_LABEL_LETTER_SPACING,
              color: dateColor,
            })}
          >
            {slot.dayOfMonth}
          </Box>
        </Stack>
      </TimelineOppositeContent>

      <TimelineSeparator sx={{ flex: "0 0 auto", width: TIMELINE_COL_W }}>
        <TimelineConnector
          sx={{
            flex: "0 0 auto",
            height: { xs: `${TIMELINE_DOT_OFFSET.xs}px`, md: `${TIMELINE_DOT_OFFSET.md}px` },
            width: RAIL_WIDTH_PX,
            bgcolor: railColor,
          }}
        />
        <TimelineDot
          sx={{
            m: 0,
            alignSelf: "center",
            p: 0,
            boxSizing: "border-box",
            width: node.size,
            height: node.size,
            bgcolor: node.bg,
            border: node.border ?? "none",
            boxShadow: node.shadow ?? "none",
          }}
        />
        <TimelineConnector sx={{ width: RAIL_WIDTH_PX, bgcolor: railColor }} />
      </TimelineSeparator>

      <TimelineContent
        sx={{
          minWidth: 0,
          m: 0,
          py: 0,
          pt: TIMELINE_CONTENT_PT,
          pb: TIMELINE_CONTENT_PB,
          px: TIMELINE_CONTENT_PX,
        }}
      >
        {hasSessions ? (
          <Stack spacing={1}>
            {slot.sessions.map((card) => (
              <SessionCard
                key={card.sessionId}
                card={card}
                isToday={slot.isToday}
                decoration={resolveCardDecoration(
                  { isToday: slot.isToday, done: card.done },
                  theme,
                )}
                onOpenSession={onOpenSession}
              />
            ))}
          </Stack>
        ) : slot.isRestDay ? (
          <RestDayCard label={slot.restLabel ?? REST_DAY_LABEL} />
        ) : (
          <Typography
            sx={{ fontSize: (t) => t.typography.pxToRem(REST_DAY_PX), color: "text.disabled" }}
          >
            {EMPTY_DAY_LABEL}
          </Typography>
        )}
      </TimelineContent>
    </TimelineItem>
  );
};
