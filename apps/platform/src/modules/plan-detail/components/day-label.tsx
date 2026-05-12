"use client";

import { Box, Stack, Typography } from "@mui/material";

import { type DayType } from "@repo/contracts/lms/day-type";

const SWATCH_SIZE_PX = 8;

type DayLabelProps = { dayType: DayType | null };

export const DayLabel: React.FC<DayLabelProps> = ({ dayType }) => {
  if (dayType === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Empty
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box
        sx={{
          bgcolor: dayType.color,
          width: SWATCH_SIZE_PX,
          height: SWATCH_SIZE_PX,
          borderRadius: "50%",
        }}
      />
      <Typography variant="body2">{dayType.name}</Typography>
    </Stack>
  );
};
