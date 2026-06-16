"use client";

import { type ReactElement } from "react";

import { Box, Stack, Typography } from "@mui/material";

import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

const DOT_SIZE_PX = 8;

type StatusDescriptor = {
  label: string;
  color: string;
};

const STATUS_DESCRIPTORS: Record<TodayStatus, StatusDescriptor> = {
  [TodayStatus.COMPLETED]: { label: "Done", color: "success.main" },
  [TodayStatus.MISSED]: { label: "Missed", color: "error.main" },
  [TodayStatus.PENDING]: { label: "Pending", color: "text.muted" },
  [TodayStatus.REST_DAY]: { label: "Rest", color: "text.muted" },
  [TodayStatus.NO_SCHEDULE]: { label: "—", color: "text.faint" },
};

export type TodayStatusLabelProps = {
  status: TodayStatus;
};

export const TodayStatusLabel = ({ status }: TodayStatusLabelProps): ReactElement => {
  const descriptor = STATUS_DESCRIPTORS[status];

  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box
        sx={{
          width: DOT_SIZE_PX,
          height: DOT_SIZE_PX,
          borderRadius: "50%",
          bgcolor: descriptor.color,
        }}
      />
      <Typography
        variant="overline"
        sx={{
          color: descriptor.color,
          letterSpacing: "0.06em",
          fontSize: (theme) => theme.typography.pxToRem(11),
        }}
      >
        {descriptor.label}
      </Typography>
    </Stack>
  );
};
