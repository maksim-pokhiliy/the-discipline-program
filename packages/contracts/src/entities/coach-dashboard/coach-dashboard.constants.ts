export enum TodayStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  MISSED = "MISSED",
  REST_DAY = "REST_DAY",
  NO_SCHEDULE = "NO_SCHEDULE",
}

export enum ProgressTrend {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}

export const MISSED_DAYS_WARNING = 3;
export const MISSED_DAYS_CRITICAL = 7;
export const NEW_ATHLETE_THRESHOLD_DAYS = 7;
export const LOW_COMPLETION_RATE = 0.3;
