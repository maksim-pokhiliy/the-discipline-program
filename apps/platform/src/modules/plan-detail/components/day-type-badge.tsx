"use client";

import { Box, Stack, Typography } from "@mui/material";

import { type DayType } from "@repo/contracts/lms/day-type";

const SWATCH_SIZE_PX = 8;

type DayTypeBadgeProps = { dayType: DayType };

export const DayTypeBadge: React.FC<DayTypeBadgeProps> = ({ dayType }) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box
      sx={{
        bgcolor: dayType.color,
        width: SWATCH_SIZE_PX,
        height: SWATCH_SIZE_PX,
        borderRadius: "50%",
      }}
    />
    <Typography variant="caption">{dayType.name}</Typography>
  </Stack>
);
