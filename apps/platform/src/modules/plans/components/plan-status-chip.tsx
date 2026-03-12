"use client";

import { Chip, type ChipProps } from "@mui/material";

import { TrainingPlanStatus, TRAINING_PLAN_STATUS_LABELS } from "@repo/contracts/training-plan";

const STATUS_COLORS: Record<TrainingPlanStatus, ChipProps["color"]> = {
  [TrainingPlanStatus.DRAFT]: "default",
  [TrainingPlanStatus.ACTIVE]: "success",
  [TrainingPlanStatus.ARCHIVED]: "warning",
};

type PlanStatusChipProps = {
  status: TrainingPlanStatus;
};

export const PlanStatusChip: React.FC<PlanStatusChipProps> = ({ status }) => (
  <Chip size="small" label={TRAINING_PLAN_STATUS_LABELS[status]} color={STATUS_COLORS[status]} />
);
