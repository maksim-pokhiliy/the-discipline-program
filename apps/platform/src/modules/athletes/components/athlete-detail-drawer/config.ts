import { ActionItemSeverity } from "@repo/contracts/coach-action-item";

export const SEVERITY_COLORS: Record<ActionItemSeverity, string> = {
  [ActionItemSeverity.CRITICAL]: "error.main",
  [ActionItemSeverity.WARNING]: "warning.main",
  [ActionItemSeverity.INFO]: "info.main",
};

export { ENROLLMENT_STATUS_COLORS as ENROLLMENT_CHIP_COLORS } from "@app/lib/config";
export { formatShortDate, formatWorkoutDate } from "@app/lib/utils/date-formatters";
