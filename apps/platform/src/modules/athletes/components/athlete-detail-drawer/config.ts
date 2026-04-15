import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";

export const SEVERITY_COLORS: Record<ActionItemSeverity, string> = {
  [ActionItemSeverity.CRITICAL]: "error.main",
  [ActionItemSeverity.WARNING]: "warning.main",
  [ActionItemSeverity.INFO]: "info.main",
};
