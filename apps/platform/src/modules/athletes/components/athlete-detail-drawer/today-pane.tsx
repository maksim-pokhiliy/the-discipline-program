"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { AthleteConsistency, Last7Day } from "@repo/contracts/coaching/coach-athletes";
import { rateToPercent } from "@repo/shared";
import { LastSevenDaysStrip } from "@repo/ui";

const NO_SESSION_LABEL = "No session today";
const EMPTY_VALUE = "—";

type TodayPaneProps = {
  todayWorkoutTitle: string | null;
  planName: string | null;
  currentWeek: number | null;
  totalWeeks: number;
  last7Days: Last7Day[];
  consistency: AthleteConsistency;
};

const formatWeek = (currentWeek: number | null, totalWeeks: number): string => {
  if (currentWeek === null) {
    return totalWeeks > 0 ? `${totalWeeks} weeks` : "Ongoing";
  }

  return totalWeeks > 0 ? `Week ${currentWeek} / ${totalWeeks}` : `Week ${currentWeek}`;
};

const renderStatCell = (label: string, value: string): React.ReactNode => (
  <Stack
    spacing={0.25}
    sx={(theme) => ({
      p: 1,
      borderRadius: theme.spacing(0.5),
      border: `1px solid ${theme.palette.divider}`,
      bgcolor: theme.palette.background.default,
      minWidth: 0,
    })}
  >
    <Typography variant="h5" sx={{ color: "text.primary" }}>
      {value}
    </Typography>
    <Typography variant="overline" sx={{ color: "text.faint" }}>
      {label}
    </Typography>
  </Stack>
);

export const TodayPane: React.FC<TodayPaneProps> = ({
  todayWorkoutTitle,
  planName,
  currentWeek,
  totalWeeks,
  last7Days,
  consistency,
}) => (
  <Stack spacing={2}>
    <Stack spacing={1}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Today&apos;s session
      </Typography>
      <Stack
        spacing={0.75}
        sx={(theme) => ({
          p: 1.5,
          borderRadius: theme.spacing(0.5),
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
        })}
      >
        <Typography variant="h5" sx={{ color: "text.primary" }}>
          {todayWorkoutTitle ?? NO_SESSION_LABEL}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
        >
          <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
            {planName ?? EMPTY_VALUE}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.faint" }}>
            ·
          </Typography>
          <Typography variant="body2" noWrap sx={{ whiteSpace: "nowrap" }}>
            {formatWeek(currentWeek, totalWeeks)}
          </Typography>
        </Stack>
      </Stack>
    </Stack>

    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {renderStatCell("4-week adherence", `${rateToPercent(consistency.adherenceRate4w)}%`)}
      {renderStatCell("Current streak", `${consistency.currentStreak}`)}
      {renderStatCell("Missed this week", `${consistency.missedThisWeek}`)}
    </Box>

    <Stack spacing={1}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Last 7 days
      </Typography>
      <LastSevenDaysStrip days={last7Days} />
    </Stack>
  </Stack>
);
