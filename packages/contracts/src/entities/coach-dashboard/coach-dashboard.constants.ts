export const ATTENTION_ALERT_TYPES = [
  "MISSED_WORKOUTS",
  "LOAD_ANOMALY",
  "PLAN_ENDING",
  "NEW_NO_START",
  "NO_PROGRESS",
  "OPEN_FLAG",
] as const;

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

export const TODAY_STATUSES = ["COMPLETED", "PENDING", "MISSED", "NO_PLAN"] as const;

export const PROGRESS_TRENDS = ["UP", "DOWN", "STABLE"] as const;

export const ACTIVITY_TYPES = ["WORKOUT_COMPLETED", "NEW_ENROLLMENT"] as const;

export const MISSED_DAYS_WARNING = 3;
export const MISSED_DAYS_CRITICAL = 7;
export const NEW_ATHLETE_THRESHOLD_DAYS = 7;
export const PLAN_ENDING_THRESHOLD_DAYS = 14;
export const LOAD_DROP_THRESHOLD = 0.7;
export const LOW_COMPLETION_RATE = 0.3;
