"use client";

import { Chip } from "@mui/material";

import { type TODAY_STATUSES } from "@repo/contracts/coach-dashboard";

type TodayStatus = (typeof TODAY_STATUSES)[number];

type AthleteStatusChipProps = {
  status: TodayStatus;
};

const STATUS_CONFIG: Record<
  TodayStatus,
  { label: string; color: "success" | "default" | "error" | "info" }
> = {
  COMPLETED: { label: "Done", color: "success" },
  PENDING: { label: "Pending", color: "info" },
  MISSED: { label: "Missed", color: "error" },
  NO_PLAN: { label: "No Plan", color: "default" },
};

export const AthleteStatusChip = ({ status }: AthleteStatusChipProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
    />
  );
};
