import { z } from "zod";

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

export const PlanOverrideScopeEnum = z.enum(["DAY", "SESSION", "BLOCK", "BLOCK_SEGMENT", "ENTRY"]);
export type PlanOverrideScopeEnum = z.infer<typeof PlanOverrideScopeEnum>;

export const PlanOverrideKindEnum = z.enum(["REPLACE", "APPEND", "SUSPEND", "NOTE"]);
export type PlanOverrideKindEnum = z.infer<typeof PlanOverrideKindEnum>;
