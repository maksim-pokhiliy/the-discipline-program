"use client";

import { Box, Stack, Typography } from "@mui/material";

import { formatDayName } from "@repo/shared";

const TODAY_CIRCLE_SIZE_PX = 24;

type DayRowHeaderProps = { date: Date; isToday: boolean };

export const DayRowHeader: React.FC<DayRowHeaderProps> = ({ date, isToday }) => {
  const weekday = formatDayName(date);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
  const dayNumber = date.getDate();

  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2">{weekday}</Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {monthLabel}
        </Typography>
        {isToday ? (
          <Box
            sx={{
              width: TODAY_CIRCLE_SIZE_PX,
              height: TODAY_CIRCLE_SIZE_PX,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: (theme) => theme.typography.body2.fontSize,
              fontWeight: (theme) => theme.typography.fontWeightMedium,
            }}
          >
            {dayNumber}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {dayNumber}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
