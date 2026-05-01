import { type ChipProps } from "@mui/material";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

export const PLAN_STATUS_COLORS: Record<TrainingPlanStatus, NonNullable<ChipProps["color"]>> = {
  [TrainingPlanStatus.DRAFT]: "default",
  [TrainingPlanStatus.ACTIVE]: "success",
  [TrainingPlanStatus.ARCHIVED]: "warning",
};
