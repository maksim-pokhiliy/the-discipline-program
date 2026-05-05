export enum ActionItemType {
  MISSED_WORKOUTS = "MISSED_WORKOUTS",
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
  AUTO_ASSIGNMENT_ENDED = "AUTO_ASSIGNMENT_ENDED",
  MANUAL_CONTACTED = "MANUAL_CONTACTED",
}

export const TYPE_PRIORITY: Record<ActionItemType, number> = {
  [ActionItemType.HEALTH_REPORT]: 0,
  [ActionItemType.MISSED_WORKOUTS]: 1,
};

export const SEVERITY_PRIORITY: Record<ActionItemSeverity, number> = {
  [ActionItemSeverity.CRITICAL]: 0,
  [ActionItemSeverity.WARNING]: 1,
  [ActionItemSeverity.INFO]: 2,
};
