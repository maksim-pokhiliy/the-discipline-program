import type { AlertColor, ChipProps } from "@mui/material";

import { ProgressTrend } from "@repo/contracts/coach-dashboard";

export type ProgressGroupConfig = {
  trend: ProgressTrend;
  title: string;
  chipColor: ChipProps["color"];
  severity: AlertColor;
  emptyMessage: string;
};

export const PROGRESS_GROUPS: ProgressGroupConfig[] = [
  {
    trend: ProgressTrend.DOWN,
    title: "Declining",
    chipColor: "error",
    severity: "error",
    emptyMessage: "No declining athletes — great work",
  },
  {
    trend: ProgressTrend.STABLE,
    title: "Stagnating",
    chipColor: "warning",
    severity: "warning",
    emptyMessage: "Nobody stagnating — everyone is moving",
  },
  {
    trend: ProgressTrend.UP,
    title: "Improving",
    chipColor: "success",
    severity: "success",
    emptyMessage: "No improving athletes yet",
  },
];

export const getDefaultProgressTab = (grouped: Map<ProgressTrend, number>): ProgressTrend => {
  for (const group of PROGRESS_GROUPS) {
    const count = grouped.get(group.trend) ?? 0;

    if (count > 0) {
      return group.trend;
    }
  }

  return ProgressTrend.DOWN;
};

export const formatCompletionRate = (rate: number): string =>
  `${Math.round(rate * 100)}% completion rate`;
