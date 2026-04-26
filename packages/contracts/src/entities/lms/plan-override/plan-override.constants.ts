export enum PlanOverrideScope {
  DAY = "DAY",
  SESSION = "SESSION",
  BLOCK = "BLOCK",
  BLOCK_SEGMENT = "BLOCK_SEGMENT",
  ENTRY = "ENTRY",
}

export enum PlanOverrideKind {
  REPLACE = "REPLACE",
  APPEND = "APPEND",
  SUSPEND = "SUSPEND",
  NOTE = "NOTE",
}

export const PLAN_OVERRIDE_SCOPES: readonly PlanOverrideScope[] = [
  PlanOverrideScope.DAY,
  PlanOverrideScope.SESSION,
  PlanOverrideScope.BLOCK,
  PlanOverrideScope.BLOCK_SEGMENT,
  PlanOverrideScope.ENTRY,
] as const;

export const PLAN_OVERRIDE_KINDS: readonly PlanOverrideKind[] = [
  PlanOverrideKind.REPLACE,
  PlanOverrideKind.APPEND,
  PlanOverrideKind.SUSPEND,
  PlanOverrideKind.NOTE,
] as const;
