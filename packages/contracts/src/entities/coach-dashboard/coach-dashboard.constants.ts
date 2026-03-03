export enum TodayStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  MISSED = "MISSED",
  NO_PLAN = "NO_PLAN",
}

export enum ProgressTrend {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}

export enum CoachActivityType {
  WORKOUT_COMPLETED = "WORKOUT_COMPLETED",
  NEW_ENROLLMENT = "NEW_ENROLLMENT",
}

export const MISSED_DAYS_WARNING = 3;
export const MISSED_DAYS_CRITICAL = 7;
export const NEW_ATHLETE_THRESHOLD_DAYS = 7;
export const LOW_COMPLETION_RATE = 0.3;
export const TRAINED_THIS_WEEK_DAYS = 7;
