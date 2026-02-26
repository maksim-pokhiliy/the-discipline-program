export const ACTION_ITEM_TYPES = ["MISSED_WORKOUTS", "NEW_NO_START", "HEALTH_REPORT"] as const;

export const ACTION_ITEM_STATUSES = ["OPEN", "RESOLVED"] as const;

export const ACTION_ITEM_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

export const ACTION_ITEM_RESOLVE_REASONS = [
  "AUTO_CONDITION_CLEARED",
  "AUTO_ENROLLMENT_ENDED",
  "MANUAL_CONTACTED",
] as const;

export const SEVERITY_PRIORITY: Record<(typeof ACTION_ITEM_SEVERITIES)[number], number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};
