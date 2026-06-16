import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import type { StatusChipConfig } from "@repo/ui";

export const SEVERITY_COLORS: Record<ActionItemSeverity, string> = {
  [ActionItemSeverity.CRITICAL]: "error.main",
  [ActionItemSeverity.WARNING]: "warning.main",
  [ActionItemSeverity.INFO]: "info.main",
};

export const TODAY_STATUS_CHIPS: Record<TodayStatus, StatusChipConfig> = {
  [TodayStatus.COMPLETED]: { label: "Trained today", color: "success" },
  [TodayStatus.MISSED]: { label: "Missed today", color: "error" },
  [TodayStatus.PENDING]: { label: "Scheduled today", color: "info" },
  [TodayStatus.REST_DAY]: { label: "Rest day" },
  [TodayStatus.NO_SCHEDULE]: { label: "No session today" },
};
