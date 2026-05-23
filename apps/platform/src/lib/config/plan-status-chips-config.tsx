import { TRAINING_PLAN_STATUS_LABELS, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import type { StatusChipConfig } from "@repo/ui";

export const PLAN_STATUS_CHIPS: Record<TrainingPlanStatus, StatusChipConfig> = {
  [TrainingPlanStatus.DRAFT]: {
    label: TRAINING_PLAN_STATUS_LABELS[TrainingPlanStatus.DRAFT],
    color: "info",
  },
  [TrainingPlanStatus.ACTIVE]: {
    label: TRAINING_PLAN_STATUS_LABELS[TrainingPlanStatus.ACTIVE],
    color: "success",
  },
  [TrainingPlanStatus.ARCHIVED]: {
    label: TRAINING_PLAN_STATUS_LABELS[TrainingPlanStatus.ARCHIVED],
  },
};
