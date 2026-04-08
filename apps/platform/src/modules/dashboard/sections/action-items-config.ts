import { createElement } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import type { AlertColor } from "@mui/material";

import {
  ActionItemSeverity,
  ActionItemType,
  SEVERITY_PRIORITY,
} from "@repo/contracts/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";
import type { StatusChipConfig } from "@repo/ui";

import { getHealthChipFromMessage } from "@app/lib/config";

export const INITIAL_VISIBLE_COUNT = 3;

const SEVERITY_TO_ALERT_COLOR: Record<ActionItemSeverity, AlertColor> = {
  [ActionItemSeverity.CRITICAL]: "error",
  [ActionItemSeverity.WARNING]: "warning",
  [ActionItemSeverity.INFO]: "info",
};

export const sortBySeverity = (items: DashboardActionItem[]): DashboardActionItem[] =>
  [...items].sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity]);

export const getSeverityColor = (severity: DashboardActionItem["severity"]): AlertColor =>
  SEVERITY_TO_ALERT_COLOR[severity];

export const getChip = (item: DashboardActionItem): StatusChipConfig | null => {
  if (item.type === ActionItemType.HEALTH_REPORT) {
    return getHealthChipFromMessage(item.message);
  }

  if (item.type === ActionItemType.NEW_NO_START) {
    return { label: "New", color: "info", icon: createElement(PersonAddIcon) };
  }

  return null;
};
