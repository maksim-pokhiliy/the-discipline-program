export const TRAINING_PLAN_CONSTANTS = {
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

export enum TrainingPlanStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export const TRAINING_PLAN_STATUS_LABELS: Record<TrainingPlanStatus, string> = {
  [TrainingPlanStatus.DRAFT]: "Draft",
  [TrainingPlanStatus.ACTIVE]: "Active",
  [TrainingPlanStatus.ARCHIVED]: "Archived",
};
