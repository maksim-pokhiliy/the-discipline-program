export enum TodayStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  MISSED = "MISSED",
  REST_DAY = "REST_DAY",
  NO_SCHEDULE = "NO_SCHEDULE",
}

export enum ProcessStatus {
  ON_TRACK = "ON_TRACK",
  STEADY = "STEADY",
  FALLING_BEHIND = "FALLING_BEHIND",
}

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  [ProcessStatus.ON_TRACK]: "On track",
  [ProcessStatus.STEADY]: "Steady",
  [ProcessStatus.FALLING_BEHIND]: "Falling behind",
};

export const MISSED_DAYS_WARNING = 3;
export const MISSED_DAYS_CRITICAL = 7;
export const NEW_ATHLETE_THRESHOLD_DAYS = 7;
export const ADHERENCE_IMPROVING_THRESHOLD = 0.1;
export const ADHERENCE_ON_TRACK_THRESHOLD = 0.7;
