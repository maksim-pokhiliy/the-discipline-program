"use client";

import { Chip, type ChipProps } from "@mui/material";

import {
  type TrainingPlanStatus,
  TRAINING_PLAN_STATUS_LABELS,
} from "@repo/contracts/training-plan";

type PlanStatusBadgeProps = Omit<ChipProps, "label" | "color"> & {
  status: TrainingPlanStatus;
};

const STATUS_COLOR_MAP: Record<TrainingPlanStatus, ChipProps["color"]> = {
  DRAFT: "default",
  ACTIVE: "success",
  ARCHIVED: "warning",
};

export const PlanStatusBadge = ({ status, ...props }: PlanStatusBadgeProps) => (
  <Chip
    label={TRAINING_PLAN_STATUS_LABELS[status]}
    color={STATUS_COLOR_MAP[status]}
    size="small"
    variant="filled"
    {...props}
  />
);
