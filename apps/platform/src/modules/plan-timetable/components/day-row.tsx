import { type ReactElement, type RefObject } from "react";

import { Box, Stack, Typography, useTheme } from "@mui/material";

import { type DaySlotView } from "@repo/contracts/lms/plan-timetable";

import {
  DATE_COL_W,
  DAY_OF_WEEK_SHORT,
  DAY_NUM_PX,
  EMPTY_DAY_LABEL,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  REST_DAY_LABEL,
  REST_DAY_PX,
  SCROLL_ANCHOR_OFFSET_PX,
  WEEK_LABEL_LETTER_SPACING,
  WEEKDAY_LETTER_SPACING,
  WEEKDAY_PX,
} from "../utils/plan-timetable.constants";
import { resolveCardDecoration, resolveSlotDecoration } from "../utils/timetable-presentation";

import { SessionCard } from "./session-card";
import { TimelineNode } from "./timeline-node";

export type DayRowProps = {
  slot: DaySlotView;
  todayRowRef?: RefObject<HTMLDivElement | null>;
  onOpenSession: (sessionId: string) => void;
};

export const DayRow = ({ slot, todayRowRef, onOpenSession }: DayRowProps): ReactElement => {
  const theme = useTheme();
  const slotDecoration = resolveSlotDecoration(slot.status, theme);
  const hasSessions = slot.sessions.length > 0;
  const emptyLabel = slot.isRestDay ? REST_DAY_LABEL : EMPTY_DAY_LABEL;

  return (
    <Stack
      ref={slot.isToday ? todayRowRef : undefined}
      direction="row"
      sx={{
        pt: 0.75,
        scrollMarginTop: slot.isToday
          ? `${theme.layout.platformHeaderHeight + SCROLL_ANCHOR_OFFSET_PX}px`
          : undefined,
      }}
    >
      <Stack spacing={0} alignItems="flex-end" sx={{ width: DATE_COL_W, flexShrink: 0, pt: 1 }}>
        <Typography
          component="span"
          sx={{
            fontSize: (t) => t.typography.pxToRem(WEEKDAY_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            letterSpacing: WEEKDAY_LETTER_SPACING,
            textTransform: "uppercase",
            color: slotDecoration.dateColor,
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
            color: slotDecoration.dateColor,
          })}
        >
          {slot.dayOfMonth}
        </Box>
      </Stack>

      <TimelineNode decoration={slotDecoration} />

      <Stack spacing={1} sx={{ flex: 1, minWidth: 0, pb: 1 }}>
        {hasSessions ? (
          slot.sessions.map((card) => (
            <SessionCard
              key={card.sessionId}
              card={card}
              isToday={slot.isToday}
              decoration={resolveCardDecoration({ isToday: slot.isToday, done: card.done }, theme)}
              onOpenSession={onOpenSession}
            />
          ))
        ) : (
          <Typography
            sx={{
              pt: 1,
              fontSize: (t) => t.typography.pxToRem(REST_DAY_PX),
              color: "text.disabled",
            }}
          >
            {emptyLabel}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
