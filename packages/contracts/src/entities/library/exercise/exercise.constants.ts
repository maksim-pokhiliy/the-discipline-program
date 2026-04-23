export const EXERCISE_CONSTANTS = {
  MAX_NAME_LENGTH: 200,
  MAX_ALIAS_LENGTH: 100,
  MAX_ALIASES: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_REVIEW_NOTES_LENGTH: 2000,
} as const;

export enum ExerciseStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  MERGED = "MERGED",
}

export const EXERCISE_STATUS_LABELS: Record<ExerciseStatus, string> = {
  [ExerciseStatus.PENDING_REVIEW]: "Pending Review",
  [ExerciseStatus.APPROVED]: "Approved",
  [ExerciseStatus.REJECTED]: "Rejected",
  [ExerciseStatus.MERGED]: "Merged",
};

export enum MeasurementUnit {
  REPS = "REPS",
  TIME_SEC = "TIME_SEC",
  DISTANCE_M = "DISTANCE_M",
  CALORIES = "CALORIES",
}

export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  [MeasurementUnit.REPS]: "Reps",
  [MeasurementUnit.TIME_SEC]: "Time (sec)",
  [MeasurementUnit.DISTANCE_M]: "Distance (m)",
  [MeasurementUnit.CALORIES]: "Calories",
};
