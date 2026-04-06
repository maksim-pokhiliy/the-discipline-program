import type { AlertColor, ChipProps } from "@mui/material";

import { ProcessStatus, PROCESS_STATUS_LABELS } from "@repo/contracts/coach-dashboard";

export type ProgressGroupConfig = {
  status: ProcessStatus;
  title: string;
  chipColor: ChipProps["color"];
  severity: AlertColor;
  emptyMessage: string;
};

export const PROGRESS_GROUPS: ProgressGroupConfig[] = [
  {
    status: ProcessStatus.FALLING_BEHIND,
    title: PROCESS_STATUS_LABELS[ProcessStatus.FALLING_BEHIND],
    chipColor: "error",
    severity: "error",
    emptyMessage: "Nobody falling behind — great work",
  },
  {
    status: ProcessStatus.STEADY,
    title: PROCESS_STATUS_LABELS[ProcessStatus.STEADY],
    chipColor: "warning",
    severity: "warning",
    emptyMessage: "Nobody in steady state",
  },
  {
    status: ProcessStatus.ON_TRACK,
    title: PROCESS_STATUS_LABELS[ProcessStatus.ON_TRACK],
    chipColor: "success",
    severity: "success",
    emptyMessage: "No athletes on track yet",
  },
];

export const getDefaultProgressTab = (grouped: Map<ProcessStatus, number>): ProcessStatus => {
  for (const group of PROGRESS_GROUPS) {
    const count = grouped.get(group.status) ?? 0;

    if (count > 0) {
      return group.status;
    }
  }

  return ProcessStatus.FALLING_BEHIND;
};
