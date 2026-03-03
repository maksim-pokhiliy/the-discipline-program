export enum ActionItemType {
  MISSED_WORKOUTS = "MISSED_WORKOUTS",
  NEW_NO_START = "NEW_NO_START",
  HEALTH_REPORT = "HEALTH_REPORT",
}

export enum ActionItemStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
}

export enum ActionItemSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export enum ActionItemResolveReason {
  AUTO_CONDITION_CLEARED = "AUTO_CONDITION_CLEARED",
  AUTO_ENROLLMENT_ENDED = "AUTO_ENROLLMENT_ENDED",
  MANUAL_CONTACTED = "MANUAL_CONTACTED",
}

export const SEVERITY_PRIORITY: Record<ActionItemSeverity, number> = {
  [ActionItemSeverity.CRITICAL]: 0,
  [ActionItemSeverity.WARNING]: 1,
  [ActionItemSeverity.INFO]: 2,
};
