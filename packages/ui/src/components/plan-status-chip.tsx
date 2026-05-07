import { Chip, type ChipProps } from "@mui/material";

import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

const PLAN_STATUS_COLORS: Record<TrainingPlanStatus, NonNullable<ChipProps["color"]>> = {
  [TrainingPlanStatus.DRAFT]: "default",
  [TrainingPlanStatus.ACTIVE]: "success",
  [TrainingPlanStatus.ARCHIVED]: "warning",
};

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
