"use client";

import { Box, Stack, Typography } from "@mui/material";

import { formatDayName } from "@repo/shared";

import { formatMonthShort } from "../lib/format-month-short";

const TODAY_DISC_SIZE_PX = 36;

type DayRowHeadProps = {
  date: Date;
  isToday: boolean;
};

export const DayRowHead: React.FC<DayRowHeadProps> = ({ date, isToday }) => (
  <Stack direction="column" spacing={0.75} sx={{ pt: 0.5, alignItems: "flex-start" }}>
    <Typography
      variant="overline"
      sx={{ fontWeight: 700 }}
      color={isToday ? "primary.main" : "text.secondary"}
    >
      {formatDayName(date)}
    </Typography>
    <Stack direction="row" spacing={0.75} alignItems="baseline">
      {isToday ? (
        <Box
          sx={{
            width: TODAY_DISC_SIZE_PX,
            height: TODAY_DISC_SIZE_PX,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h4">{date.getDate()}</Typography>
        </Box>
      ) : (
        <Typography variant="h2">{date.getDate()}</Typography>
      )}
      <Typography variant="overline" color="text.disabled">
        {formatMonthShort(date)}
      </Typography>
    </Stack>
  </Stack>
);
