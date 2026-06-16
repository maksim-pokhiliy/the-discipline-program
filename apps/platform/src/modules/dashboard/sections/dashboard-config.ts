import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import type { PulseBandCellTone, SectionHeadCountTone } from "@repo/ui";

const PLAN_NAME_MAX_LENGTH = 30;
const PLAN_NAME_TRUNCATE_LENGTH = 28;
const EMPTY_PLAN_LABEL = "—";
const LAST_SEEN_CRITICAL_DAYS = 4;

export const shortPlan = (name: string | null): string => {
  if (name === null || name.length === 0) {
    return EMPTY_PLAN_LABEL;
  }

  return name.length > PLAN_NAME_MAX_LENGTH
    ? `${name.slice(0, PLAN_NAME_TRUNCATE_LENGTH).trim()}…`
    : name;
};

export const isLastSeenCritical = (daysSinceLastActivity: number): boolean =>
  daysSinceLastActivity >= LAST_SEEN_CRITICAL_DAYS;

export const getAttentionTone = (items: DashboardActionItem[]): "error" | "warn" | "success" => {
  if (items.some((item) => item.severity === ActionItemSeverity.CRITICAL)) {
    return "error";
  }

  return items.length > 0 ? "warn" : "success";
};

export const ATTENTION_TONE_TO_COUNT_TONE: Record<
  ReturnType<typeof getAttentionTone>,
  SectionHeadCountTone
> = {
  error: "error",
  warn: "warn",
  success: "success",
};

export const ATTENTION_TONE_TO_PULSE_TONE: Record<
  ReturnType<typeof getAttentionTone>,
  PulseBandCellTone
> = {
  error: "error",
  warn: "warning",
  success: "success",
};
