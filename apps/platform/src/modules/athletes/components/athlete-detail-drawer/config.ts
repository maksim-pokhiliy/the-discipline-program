import { ActionItemSeverity } from "@repo/contracts/coach-action-item";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";

export const SEVERITY_COLORS: Record<ActionItemSeverity, string> = {
  [ActionItemSeverity.CRITICAL]: "error.main",
  [ActionItemSeverity.WARNING]: "warning.main",
  [ActionItemSeverity.INFO]: "info.main",
};

export const ENROLLMENT_CHIP_COLORS: Record<PlanEnrollmentStatus, "success" | "warning"> = {
  [PlanEnrollmentStatus.ACTIVE]: "success",
  [PlanEnrollmentStatus.PAUSED]: "warning",
};

export const formatShortDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatWorkoutDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
