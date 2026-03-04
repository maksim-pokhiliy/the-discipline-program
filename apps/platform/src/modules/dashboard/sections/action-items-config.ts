import { createElement } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { AlertColor } from "@mui/material";

import { ActionItemSeverity, ActionItemType } from "@repo/contracts/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";

import type { AthleteCardChip } from "../components";
import { getHealthChipFromMessage } from "../components/health-chips-config";

export const INITIAL_VISIBLE_COUNT = 3;

const SEVERITY_TO_ALERT_COLOR: Record<ActionItemSeverity, AlertColor> = {
  [ActionItemSeverity.CRITICAL]: "error",
  [ActionItemSeverity.WARNING]: "warning",
  [ActionItemSeverity.INFO]: "info",
};

const TYPE_CHIP: Record<ActionItemType, AthleteCardChip> = {
  [ActionItemType.HEALTH_REPORT]: { label: "Health", color: "error" },
  [ActionItemType.MISSED_WORKOUTS]: {
    label: "Missed",
    color: "warning",
    icon: createElement(WarningAmberIcon),
  },
  [ActionItemType.NEW_NO_START]: {
    label: "New",
    color: "info",
    icon: createElement(PersonAddIcon),
  },
};

export const getSeverityColor = (severity: DashboardActionItem["severity"]): AlertColor =>
  SEVERITY_TO_ALERT_COLOR[severity];

export const getChip = (item: DashboardActionItem): AthleteCardChip => {
  if (item.type === ActionItemType.HEALTH_REPORT) {
    return getHealthChipFromMessage(item.message) ?? TYPE_CHIP[item.type];
  }

  return TYPE_CHIP[item.type];
};
