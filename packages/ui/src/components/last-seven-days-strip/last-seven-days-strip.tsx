"use client";

import { type ReactElement } from "react";

import { alpha, Box, Stack, type Theme, Typography } from "@mui/material";

import { type Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

const MARK_SIZE_PX = 12;
const LEGEND_DOT_SIZE_PX = 8;
const CELL_PADDING_Y_PX = 6;
const CELL_PADDING_X_PX = 4;
const REST_MARK_ALPHA = 0.2;
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const LAST_INDEX = 6;

type MarkStyle = {
  bgcolor: string;
  isDashed: boolean;
};

const restColor = (theme: Theme): string => alpha(theme.palette.common.white, REST_MARK_ALPHA);

type LegendEntry = {
  label: string;
  color: (theme: Theme) => string;
};

const LEGEND_ENTRIES: LegendEntry[] = [
  { label: "Done", color: (theme) => theme.palette.success.main },
  { label: "Missed", color: (theme) => theme.palette.error.main },
  { label: "Rest", color: restColor },
];

const resolveMarkStyle = (status: TodayStatus, theme: Theme): MarkStyle => {
  switch (status) {
    case TodayStatus.COMPLETED:
      return { bgcolor: theme.palette.success.main, isDashed: false };
    case TodayStatus.MISSED:
      return { bgcolor: theme.palette.error.main, isDashed: false };
    case TodayStatus.REST_DAY:
      return { bgcolor: restColor(theme), isDashed: false };
    case TodayStatus.PENDING:
    case TodayStatus.NO_SCHEDULE:
      return { bgcolor: "transparent", isDashed: true };
  }
};

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

const getDayLetter = (date: Date | string): string => DAY_LETTERS[toDate(date).getDay()] ?? "";

export type LastSevenDaysStripProps = {
  days: Last7Day[];
};

export const LastSevenDaysStrip = ({ days }: LastSevenDaysStripProps): ReactElement => (
  <Stack spacing={1}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 0.5,
      }}
    >
      {days.map((day, index) => {
        const isToday = index === LAST_INDEX;

        return (
          <Stack
            key={toDate(day.date).toISOString()}
            alignItems="center"
            spacing={0.5}
            sx={(theme) => ({
              borderRadius: theme.spacing(0.5),
              border: `1px solid ${isToday ? theme.palette.primary.main : theme.palette.divider}`,
              bgcolor: theme.palette.background.default,
              px: `${CELL_PADDING_X_PX}px`,
              py: `${CELL_PADDING_Y_PX}px`,
              minWidth: 0,
            })}
          >
            <Typography
              variant="overline"
              sx={{
                fontSize: (theme) => theme.typography.pxToRem(9),
                letterSpacing: "0.08em",
                color: isToday ? "primary.main" : "text.faint",
              }}
            >
              {getDayLetter(day.date)}
            </Typography>
            <Box
              sx={(theme) => {
                const mark = resolveMarkStyle(day.status, theme);

                return {
                  width: MARK_SIZE_PX,
                  height: MARK_SIZE_PX,
                  borderRadius: "50%",
                  bgcolor: mark.bgcolor,
                  ...(mark.isDashed && {
                    border: `1px dashed ${theme.palette.divider}`,
                  }),
                };
              }}
            />
          </Stack>
        );
      })}
    </Box>
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {LEGEND_ENTRIES.map((entry) => (
        <Stack key={entry.label} direction="row" alignItems="center" spacing={0.5}>
          <Box
            sx={(theme) => ({
              width: LEGEND_DOT_SIZE_PX,
              height: LEGEND_DOT_SIZE_PX,
              borderRadius: "50%",
              bgcolor: entry.color(theme),
            })}
          />
          <Typography
            sx={{
              fontSize: (theme) => theme.typography.pxToRem(11),
              color: "text.muted",
            }}
          >
            {entry.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </Stack>
);
