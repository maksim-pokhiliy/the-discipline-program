import { createElement } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { AlertColor } from "@mui/material";

import { ActionItemType } from "@repo/contracts/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";

import type { AthleteCardChip } from "../components";
import { getHealthChipFromMessage } from "../components/health-chips-config";

export const INITIAL_VISIBLE_COUNT = 3;

type TypeConfig = {
  severity: AlertColor;
  chip: AthleteCardChip;
};

const TYPE_CONFIG: Record<ActionItemType, TypeConfig> = {
  [ActionItemType.HEALTH_REPORT]: {
    severity: "error",
    chip: { label: "Health", color: "error" },
  },
  [ActionItemType.MISSED_WORKOUTS]: {
    severity: "warning",
    chip: { label: "Missed", color: "warning", icon: createElement(WarningAmberIcon) },
  },
  [ActionItemType.NEW_NO_START]: {
    severity: "info",
    chip: { label: "New", color: "info", icon: createElement(PersonAddIcon) },
  },
};

export const getTypeConfig = (type: ActionItemType): TypeConfig => TYPE_CONFIG[type];

export const getChip = (item: DashboardActionItem): AthleteCardChip => {
  if (item.type === ActionItemType.HEALTH_REPORT) {
    return getHealthChipFromMessage(item.message) ?? TYPE_CONFIG[item.type].chip;
  }

  return TYPE_CONFIG[item.type].chip;
};
