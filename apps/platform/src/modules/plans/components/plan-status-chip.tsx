"use client";

import { Chip } from "@mui/material";

import {
  type TrainingPlanStatus,
  TRAINING_PLAN_STATUS_LABELS,
} from "@repo/contracts/training-plan";

import { PLAN_STATUS_COLORS } from "@app/lib/config";

type PlanStatusChipProps = {
  status: TrainingPlanStatus;
};

export const PlanStatusChip: React.FC<PlanStatusChipProps> = ({ status }) => (
  <Chip
    size="small"
    label={TRAINING_PLAN_STATUS_LABELS[status]}
    color={PLAN_STATUS_COLORS[status]}
  />
);
