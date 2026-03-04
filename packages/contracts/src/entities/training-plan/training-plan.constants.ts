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
