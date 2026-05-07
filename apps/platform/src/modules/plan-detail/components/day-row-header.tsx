"use client";

import { Stack, Typography } from "@mui/material";

import { type DayType } from "@repo/contracts/lms/day-type";
import { formatDayHeader } from "@repo/shared";

import { DayTypeBadge } from "./day-type-badge";

type DayRowHeaderProps = { date: Date; dayType: DayType | null };

export const DayRowHeader: React.FC<DayRowHeaderProps> = ({ date, dayType }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Typography variant="subtitle2">{formatDayHeader(date)}</Typography>
    {dayType !== null ? <DayTypeBadge dayType={dayType} /> : null}
  </Stack>
);
